import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, type User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OAuthProviderRegistry } from './providers/oauth-provider.registry';
import { TokenService } from './token.service';
import { isConfiguredPlatformAdminEmail } from './utils/admin-email';

export interface LoginWithProviderInput {
  providerName: string;
  code?: string;
  state?: string;
  oauthCookieValue?: string;
  userAgent?: string;
}

export interface AuthSessionResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  refreshMaxAgeMs: number;
}

function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerRegistry: OAuthProviderRegistry,
    private readonly tokenService: TokenService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  private isConfiguredAdminEmail(email: string | null | undefined): boolean {
    return isConfiguredPlatformAdminEmail(email, this.configService);
  }

  getSupportedProviders() {
    return {
      passwordLoginEnabled: false,
      providers: this.providerRegistry.list(),
      note: 'Mandatory SSO login to ensure real player identities and prevent spam/bot accounts.',
    };
  }

  beginOAuthLogin(providerName: string): {
    authorizationUrl: string;
    oauthCookieValue: string;
  } {
    const provider = this.providerRegistry.get(providerName);
    const state = randomBytes(24).toString('base64url');
    const codeVerifier = randomBytes(32).toString('base64url');

    const authorizationUrl = provider.getAuthorizationUrl({
      state,
      codeVerifier,
    });

    const oauthCookieValue = this.tokenService.signOAuthStateCookie({
      state,
      codeVerifier,
      provider: provider.name,
    });

    return {
      authorizationUrl,
      oauthCookieValue,
    };
  }

  async loginWithProvider(input: LoginWithProviderInput): Promise<AuthSessionResult> {
    const provider = this.providerRegistry.get(input.providerName);

    if (!input.code || !input.state || !input.oauthCookieValue) {
      throw new BadRequestException({
        code: 'INVALID_OAUTH_STATE',
        message: 'Missing OAuth authorization code or state parameter',
      });
    }

    const cookiePayload = this.tokenService.verifyOAuthStateCookie(input.oauthCookieValue);

    if (cookiePayload.provider !== provider.name || !safeEquals(cookiePayload.state, input.state)) {
      throw new BadRequestException({
        code: 'INVALID_OAUTH_STATE',
        message: 'Mismatched OAuth state parameter',
      });
    }

    const profile = await provider.exchangeCode({
      code: input.code,
      codeVerifier: cookiePayload.codeVerifier,
    });

    const shouldBeAdmin = this.isConfiguredAdminEmail(profile.email);

    let user: User;
    if (profile.email && typeof this.prisma.user.findUnique === 'function') {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (
        existingByEmail &&
        existingByEmail.provider === profile.provider &&
        existingByEmail.providerId !== profile.providerId &&
        typeof this.prisma.user.update === 'function'
      ) {
        user = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            providerId: profile.providerId,
            name: profile.name,
            avatarUrl: profile.avatarUrl ?? null,
            ...(shouldBeAdmin ? { role: UserRole.ADMIN } : {}),
          },
        });
      } else {
        user = await this.prisma.user.upsert({
          where: {
            provider_providerId: {
              provider: profile.provider,
              providerId: profile.providerId,
            },
          },
          update: {
            name: profile.name,
            avatarUrl: profile.avatarUrl ?? null,
            ...(profile.email !== undefined ? { email: profile.email } : {}),
            ...(shouldBeAdmin ? { role: UserRole.ADMIN } : {}),
          },
          create: {
            provider: profile.provider,
            providerId: profile.providerId,
            role: shouldBeAdmin ? UserRole.ADMIN : UserRole.USER,
            email: profile.email ?? null,
            name: profile.name,
            avatarUrl: profile.avatarUrl ?? null,
          },
        });
      }
    } else {
      user = await this.prisma.user.upsert({
        where: {
          provider_providerId: {
            provider: profile.provider,
            providerId: profile.providerId,
          },
        },
        update: {
          name: profile.name,
          avatarUrl: profile.avatarUrl ?? null,
          ...(profile.email !== undefined ? { email: profile.email } : {}),
          ...(shouldBeAdmin ? { role: UserRole.ADMIN } : {}),
        },
        create: {
          provider: profile.provider,
          providerId: profile.providerId,
          role: shouldBeAdmin ? UserRole.ADMIN : UserRole.USER,
          email: profile.email ?? null,
          name: profile.name,
          avatarUrl: profile.avatarUrl ?? null,
        },
      });
    }

    if (user.status === AccountStatus.BANNED) {
      throw new ForbiddenException({
        code: 'ACCOUNT_BANNED',
        message: 'Account has been permanently banned',
      });
    }

    const tokens = await this.tokenService.issueSessionTokens(user, input.userAgent);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshMaxAgeMs: this.tokenService.getRefreshTtlMs(),
    };
  }

  async refreshSession(rawRefreshToken: string | undefined, userAgent?: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException({
        code: 'MISSING_REFRESH_TOKEN',
        message: 'Refresh token cookie is required',
      });
    }

    const rotated = await this.tokenService.rotateRefreshToken(rawRefreshToken, userAgent);

    return {
      user: rotated.user,
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      refreshMaxAgeMs: this.tokenService.getRefreshTtlMs(),
    };
  }

  async logout(params: { rawRefreshToken?: string; userId?: string }): Promise<void> {
    await this.tokenService.revokeRefreshToken(params);
  }

  tryExtractUserId(rawAccessToken?: string): string | undefined {
    if (!rawAccessToken) {
      return undefined;
    }
    try {
      const payload = this.tokenService.verifyAccessToken(rawAccessToken);
      return payload.sub;
    } catch {
      return undefined;
    }
  }

  async getProfile(userId: string) {
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    if (user.status === AccountStatus.BANNED) {
      throw new ForbiddenException({
        code: 'ACCOUNT_BANNED',
        message: 'Account has been permanently banned',
      });
    }

    if (user.role !== UserRole.ADMIN && this.isConfiguredAdminEmail(user.email)) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.ADMIN },
      });
    }

    return {
      id: user.id,
      provider: user.provider,
      providerId: user.providerId,
      role: user.role,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      skillLevel: user.skillLevel,
      preferredCity: user.preferredCity,
      status: user.status,
      shadowbanUntil: user.shadowbanUntil,
      flakeCount: user.flakeCount,
      totalMatches: user.totalMatches,
      thumbsUp: user.thumbsUp,
      thumbsDown: user.thumbsDown,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
