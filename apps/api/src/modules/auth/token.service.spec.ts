import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, AuthProvider, type RefreshToken, type User } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Clock } from '../../common/clock/clock';
import type { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from './token.service';

class FakeClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return new Date(this.current.getTime());
  }

  advanceSeconds(seconds: number): void {
    this.current = new Date(this.current.getTime() + seconds * 1000);
  }

  advanceDays(days: number): void {
    this.current = new Date(this.current.getTime() + days * 24 * 60 * 60 * 1000);
  }
}

function createFakeTokenPrisma(user: User) {
  const rows: RefreshToken[] = [];
  let seq = 1;

  const refreshTokenRepo = {
    create: async ({
      data,
    }: {
      data: Partial<RefreshToken> & { userId: string; tokenHash: string; expiresAt: Date };
    }) => {
      const record: RefreshToken = {
        id: `rt_${seq++}`,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        revokedAt: data.revokedAt ?? null,
        replacedById: data.replacedById ?? null,
        userAgent: data.userAgent ?? null,
        createdAt: data.createdAt ?? new Date(),
      };
      rows.push(record);
      return record;
    },
    findUnique: async ({ where }: { where: { tokenHash: string } }) => {
      const found = rows.find((r) => r.tokenHash === where.tokenHash);
      if (!found) {
        return null;
      }
      return { ...found, user };
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<RefreshToken> }) => {
      const idx = rows.findIndex((r) => r.id === where.id);
      const existing = rows[idx];
      if (idx === -1 || !existing) {
        throw new Error('RefreshToken not found');
      }
      const updated: RefreshToken = { ...existing, ...data };
      rows[idx] = updated;
      return updated;
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: { userId?: string; tokenHash?: string; revokedAt?: null };
      data: Partial<RefreshToken>;
    }) => {
      let count = 0;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) {
          continue;
        }
        const matchesUser = where.userId === undefined || row.userId === where.userId;
        const matchesHash = where.tokenHash === undefined || row.tokenHash === where.tokenHash;
        const matchesRevoked = where.revokedAt === undefined || row.revokedAt === where.revokedAt;

        if (matchesUser && matchesHash && matchesRevoked) {
          rows[i] = { ...row, ...data };
          count++;
        }
      }
      return { count };
    },
  };

  const prisma = {
    refreshToken: refreshTokenRepo,
    $transaction: async <T>(fn: (tx: { refreshToken: typeof refreshTokenRepo }) => Promise<T>) =>
      fn({ refreshToken: refreshTokenRepo }),
  } as unknown as PrismaService;

  return { prisma, rows };
}

describe('TokenService', () => {
  const sampleUser: User = {
    id: 'user_minh_01',
    provider: AuthProvider.GOOGLE,
    providerId: 'google-sub-minh',
    email: 'minh@saomai.club',
    name: 'Minh Nguyen',
    phone: null,
    avatarUrl: 'https://example.com/minh.png',
    skillLevel: 'Kha',
    flakeCount: 0,
    totalMatches: 12,
    thumbsUp: 5,
    thumbsDown: 0,
    status: AccountStatus.ACTIVE,
    shadowbanUntil: null,
    createdAt: new Date('2026-11-14T10:00:00.000Z'),
    updatedAt: new Date('2026-11-14T10:00:00.000Z'),
  };

  let clock: FakeClock;
  let rows: RefreshToken[];
  let tokenService: TokenService;

  beforeEach(() => {
    clock = new FakeClock(new Date('2026-11-14T12:00:00.000Z'));
    const fakeDb = createFakeTokenPrisma(sampleUser);
    rows = fakeDb.rows;

    const config = new ConfigService({
      JWT_ACCESS_SECRET: 'unit-test-access-secret-key-32-chars',
      JWT_REFRESH_TTL_DAYS: 30,
    });

    tokenService = new TokenService(fakeDb.prisma, config, clock);
  });

  it('signs and verifies access JWTs and rejects after 15 minutes using fake Clock', () => {
    const token = tokenService.signAccessToken(sampleUser);
    const payload = tokenService.verifyAccessToken(token);

    expect(payload.sub).toBe(sampleUser.id);
    expect(payload.provider).toBe(AuthProvider.GOOGLE);
    expect(payload.exp - payload.iat).toBe(15 * 60);

    clock.advanceSeconds(15 * 60);
    expect(() => tokenService.verifyAccessToken(token)).toThrowError(UnauthorizedException);
  });

  it('stores SHA-256 hash on issue and rotates refresh token with replacedById link', async () => {
    const issued = await tokenService.issueSessionTokens(sampleUser, 'Vitest/1.0');

    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).toBe(tokenService.hashToken(issued.refreshToken));
    expect(rows[0]?.tokenHash).not.toBe(issued.refreshToken);
    expect(rows[0]?.revokedAt).toBeNull();

    clock.advanceSeconds(60);
    const rotated = await tokenService.rotateRefreshToken(issued.refreshToken, 'Vitest/1.0');

    expect(rotated.refreshToken).not.toBe(issued.refreshToken);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.revokedAt).toEqual(clock.now());
    expect(rows[0]?.replacedById).toBe(rows[1]?.id);
    expect(rows[1]?.revokedAt).toBeNull();
  });

  it('detects refresh token reuse and revokes all active user sessions in the family', async () => {
    const first = await tokenService.issueSessionTokens(sampleUser);
    clock.advanceSeconds(30);
    const second = await tokenService.rotateRefreshToken(first.refreshToken);
    clock.advanceSeconds(30);
    const third = await tokenService.rotateRefreshToken(second.refreshToken);

    expect(rows.filter((r) => r.revokedAt === null)).toHaveLength(1);
    expect(rows.find((r) => r.revokedAt === null)?.tokenHash).toBe(
      tokenService.hashToken(third.refreshToken),
    );

    // Replay the already-rotated first refresh token
    clock.advanceSeconds(10);
    await expect(tokenService.rotateRefreshToken(first.refreshToken)).rejects.toMatchObject({
      response: {
        code: 'REFRESH_TOKEN_REUSED',
      },
    });

    // Every session for the user must now be revoked
    expect(rows.filter((r) => r.revokedAt === null)).toHaveLength(0);
    await expect(tokenService.rotateRefreshToken(third.refreshToken)).rejects.toThrowError(
      UnauthorizedException,
    );
  });

  it('rejects expired refresh tokens after 30 days', async () => {
    const issued = await tokenService.issueSessionTokens(sampleUser);

    clock.advanceDays(30);
    await expect(tokenService.rotateRefreshToken(issued.refreshToken)).rejects.toMatchObject({
      response: {
        code: 'REFRESH_TOKEN_EXPIRED',
      },
    });
    expect(rows[0]?.revokedAt).toEqual(clock.now());
  });
});
