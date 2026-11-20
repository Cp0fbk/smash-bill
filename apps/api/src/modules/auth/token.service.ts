import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, type AuthProvider, type User } from '@prisma/client';
import type { Clock } from '../../common/clock/clock';
import { CLOCK } from '../../common/constants/injection-tokens';
import { PrismaService } from '../../prisma/prisma.service';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
export const OAUTH_STATE_TTL_SECONDS = 10 * 60; // 10 minutes
export const DEFAULT_REFRESH_TTL_DAYS = 30;

export interface AccessTokenPayload {
  sub: string;
  provider: AuthProvider;
  status: AccountStatus;
  iat: number;
  exp: number;
}

export interface OAuthStateCookiePayload {
  state: string;
  codeVerifier: string;
  provider: AuthProvider;
  iat: number;
  exp: number;
}

export interface IssuedSessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface RotatedSessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  user: User;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

@Injectable()
export class TokenService {
  private readonly secret: string;
  private readonly refreshTtlDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {
    this.secret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'dev-jwt-access-secret-change-in-production';
    this.refreshTtlDays =
      Number(this.configService.get<number>('JWT_REFRESH_TTL_DAYS')) || DEFAULT_REFRESH_TTL_DAYS;
  }

  getRefreshTtlMs(): number {
    return this.refreshTtlDays * 24 * 60 * 60 * 1000;
  }

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  signAccessToken(user: Pick<User, 'id' | 'provider' | 'status'>): string {
    const nowSec = Math.floor(this.clock.now().getTime() / 1000);
    const payload: AccessTokenPayload = {
      sub: user.id,
      provider: user.provider,
      status: user.status,
      iat: nowSec,
      exp: nowSec + ACCESS_TOKEN_TTL_SECONDS,
    };

    return this.signJwt(payload);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const payload = this.verifyJwt<AccessTokenPayload>(token, () => {
      throw new UnauthorizedException({
        code: 'INVALID_ACCESS_TOKEN',
        message: 'Invalid or expired access token',
      });
    });

    if (!payload.sub || !payload.provider || !payload.status) {
      throw new UnauthorizedException({
        code: 'INVALID_ACCESS_TOKEN',
        message: 'Malformed access token payload',
      });
    }

    return payload;
  }

  signOAuthStateCookie(input: {
    state: string;
    codeVerifier: string;
    provider: AuthProvider;
  }): string {
    const nowSec = Math.floor(this.clock.now().getTime() / 1000);
    const payload: OAuthStateCookiePayload = {
      state: input.state,
      codeVerifier: input.codeVerifier,
      provider: input.provider,
      iat: nowSec,
      exp: nowSec + OAUTH_STATE_TTL_SECONDS,
    };

    return this.signJwt(payload);
  }

  verifyOAuthStateCookie(cookieValue: string): OAuthStateCookiePayload {
    const payload = this.verifyJwt<OAuthStateCookiePayload>(cookieValue, () => {
      throw new BadRequestException({
        code: 'INVALID_OAUTH_STATE',
        message: 'Invalid or expired OAuth state cookie',
      });
    });

    if (!payload.state || !payload.codeVerifier || !payload.provider) {
      throw new BadRequestException({
        code: 'INVALID_OAUTH_STATE',
        message: 'Malformed OAuth state cookie',
      });
    }

    return payload;
  }

  async issueSessionTokens(
    user: Pick<User, 'id' | 'provider' | 'status'>,
    userAgent?: string,
  ): Promise<IssuedSessionTokens> {
    const accessToken = this.signAccessToken(user);
    const refreshToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(refreshToken);
    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + this.getRefreshTtlMs());

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ...(userAgent ? { userAgent } : {}),
        createdAt: now,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async rotateRefreshToken(
    rawRefreshToken: string,
    userAgent?: string,
  ): Promise<RotatedSessionTokens> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existing) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token',
      });
    }

    const now = this.clock.now();

    // Reuse detection: if token was already rotated or revoked, revoke all active user sessions
    if (existing.revokedAt !== null || existing.replacedById !== null) {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId: existing.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REUSED',
        message: 'Refresh token reuse detected; all sessions have been revoked',
      });
    }

    if (existing.expiresAt.getTime() <= now.getTime()) {
      await this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: now },
      });

      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired',
      });
    }

    if (existing.user.status === AccountStatus.BANNED) {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId: existing.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      throw new ForbiddenException({
        code: 'ACCOUNT_BANNED',
        message: 'Account has been permanently banned',
      });
    }

    const newRawRefreshToken = randomBytes(32).toString('base64url');
    const newTokenHash = this.hashToken(newRawRefreshToken);
    const expiresAt = new Date(now.getTime() + this.getRefreshTtlMs());

    await this.prisma.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({
        data: {
          userId: existing.userId,
          tokenHash: newTokenHash,
          expiresAt,
          ...(userAgent ? { userAgent } : {}),
          createdAt: now,
        },
      });

      await tx.refreshToken.update({
        where: { id: existing.id },
        data: {
          revokedAt: now,
          replacedById: created.id,
        },
      });
    });

    const accessToken = this.signAccessToken(existing.user);

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      expiresAt,
      user: existing.user,
    };
  }

  async revokeRefreshToken(params: { rawRefreshToken?: string; userId?: string }): Promise<void> {
    const now = this.clock.now();

    if (params.rawRefreshToken) {
      const tokenHash = this.hashToken(params.rawRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });
    }

    if (params.userId) {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId: params.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });
    }
  }

  private signJwt(payload: object): string {
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${header}.${body}`;
    const signature = createHmac('sha256', this.secret).update(signingInput).digest('base64url');
    return `${signingInput}.${signature}`;
  }

  private verifyJwt<T extends { exp: number }>(token: string, onError: () => never): T {
    if (!token || typeof token !== 'string') {
      onError();
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      onError();
    }

    const [headerPart, payloadPart, signaturePart] = parts as [string, string, string];
    const signingInput = `${headerPart}.${payloadPart}`;
    const expectedSig = createHmac('sha256', this.secret).update(signingInput).digest();

    let actualSig: Buffer;
    try {
      actualSig = Buffer.from(signaturePart, 'base64url');
    } catch {
      onError();
    }

    if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
      onError();
    }

    let payload: T;
    try {
      payload = JSON.parse(base64UrlDecode(payloadPart)) as T;
    } catch {
      onError();
    }

    const nowSec = Math.floor(this.clock.now().getTime() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
      onError();
    }

    return payload;
  }
}
