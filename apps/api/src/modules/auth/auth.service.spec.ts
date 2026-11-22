import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, AuthProvider, type User, UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { SystemClock } from '../../common/clock/clock';
import type { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import type { OAuthProfile, OAuthProvider } from './domain/oauth-provider';
import { OAuthProviderRegistry } from './providers/oauth-provider.registry';
import { TokenService } from './token.service';

class ConfigurableFakeProvider implements OAuthProvider {
  readonly name = AuthProvider.GOOGLE;
  public profileToReturn: OAuthProfile = {
    provider: AuthProvider.GOOGLE,
    providerId: 'google-sub-100',
    email: 'admin@saomai.club',
    name: 'Minh Nguyen',
    avatarUrl: 'https://example.com/avatar.png',
  };

  getAuthorizationUrl(params: { state: string; codeVerifier: string }): string {
    return `https://accounts.google.com/o/oauth2/v2/auth?state=${params.state}`;
  }

  async exchangeCode(_params: { code: string; codeVerifier: string }): Promise<OAuthProfile> {
    return this.profileToReturn;
  }
}

describe('AuthService', () => {
  let provider: ConfigurableFakeProvider;
  let usersByProviderKey: Map<string, User>;
  let authService: AuthService;

  beforeEach(() => {
    provider = new ConfigurableFakeProvider();
    usersByProviderKey = new Map<string, User>();

    const prisma = {
      user: {
        upsert: async ({
          where,
          update,
          create,
        }: {
          where: { provider_providerId: { provider: AuthProvider; providerId: string } };
          update: Partial<User>;
          create: Partial<User> & { provider: AuthProvider; providerId: string; name: string };
        }) => {
          const key = `${where.provider_providerId.provider}:${where.provider_providerId.providerId}`;
          const existing = usersByProviderKey.get(key);
          if (existing) {
            const updated: User = {
              ...existing,
              ...update,
              updatedAt: new Date(),
            };
            usersByProviderKey.set(key, updated);
            return updated;
          }

          const created: User = {
            id: `usr_${usersByProviderKey.size + 1}`,
            provider: create.provider,
            providerId: create.providerId,
            role: create.role ?? UserRole.USER,
            email: create.email ?? null,
            name: create.name,
            phone: null,
            avatarUrl: create.avatarUrl ?? null,
            skillLevel: null,
            preferredCity: null,
            flakeCount: 0,
            totalMatches: 0,
            thumbsUp: 0,
            thumbsDown: 0,
            status: AccountStatus.ACTIVE,
            shadowbanUntil: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          usersByProviderKey.set(key, created);
          return created;
        },
        findUnique: async ({ where }: { where: { id: string } }) => {
          return Array.from(usersByProviderKey.values()).find((u) => u.id === where.id) ?? null;
        },
      },
      refreshToken: {
        create: async ({ data }: { data: Record<string, unknown> }) => ({
          id: 'rt_1',
          ...data,
        }),
      },
    } as unknown as PrismaService;

    const config = new ConfigService({
      JWT_ACCESS_SECRET: 'test-access-secret-key',
      JWT_REFRESH_TTL_DAYS: 30,
      ADMIN_EMAIL: 'admin@saomai.club',
    });
    const registry = new OAuthProviderRegistry([provider]);
    const tokenService = new TokenService(prisma, config, new SystemClock());
    authService = new AuthService(prisma, registry, tokenService, config);
  });

  it('auto-promotes user to UserRole.ADMIN when email matches ADMIN_EMAIL in env', async () => {
    const start = authService.beginOAuthLogin('google');
    const state = new URL(start.authorizationUrl).searchParams.get('state') ?? '';

    const session = await authService.loginWithProvider({
      providerName: 'google',
      code: 'admin-code-1',
      state,
      oauthCookieValue: start.oauthCookieValue,
    });

    expect(session.user.email).toBe('admin@saomai.club');
    expect(session.user.role).toBe(UserRole.ADMIN);
  });

  it('upserts user without email and updates name/avatar on subsequent logins', async () => {
    provider.profileToReturn = {
      provider: AuthProvider.GOOGLE,
      providerId: 'google-no-email-99',
      name: 'Initial Name',
      avatarUrl: 'https://example.com/v1.png',
    };

    const start1 = authService.beginOAuthLogin('google');
    const state1 = new URL(start1.authorizationUrl).searchParams.get('state') ?? '';

    const session1 = await authService.loginWithProvider({
      providerName: 'google',
      code: 'auth-code-1',
      state: state1,
      oauthCookieValue: start1.oauthCookieValue,
    });

    expect(session1.user.email).toBeNull();
    expect(session1.user.name).toBe('Initial Name');

    // Second login updates name & avatar
    provider.profileToReturn = {
      provider: AuthProvider.GOOGLE,
      providerId: 'google-no-email-99',
      name: 'Updated Court Name',
      avatarUrl: 'https://example.com/v2.png',
    };

    const start2 = authService.beginOAuthLogin('google');
    const state2 = new URL(start2.authorizationUrl).searchParams.get('state') ?? '';

    const session2 = await authService.loginWithProvider({
      providerName: 'google',
      code: 'auth-code-2',
      state: state2,
      oauthCookieValue: start2.oauthCookieValue,
    });

    expect(session2.user.id).toBe(session1.user.id);
    expect(session2.user.name).toBe('Updated Court Name');
    expect(session2.user.avatarUrl).toBe('https://example.com/v2.png');
  });

  it('rejects BANNED user login with 403 ACCOUNT_BANNED', async () => {
    usersByProviderKey.set('GOOGLE:google-sub-100', {
      id: 'usr_banned_1',
      provider: AuthProvider.GOOGLE,
      providerId: 'google-sub-100',
      role: UserRole.USER,
      email: 'banned@saomai.club',
      name: 'Banned User',
      phone: null,
      avatarUrl: null,
      skillLevel: null,
      preferredCity: null,
      flakeCount: 5,
      totalMatches: 5,
      thumbsUp: 0,
      thumbsDown: 5,
      status: AccountStatus.BANNED,
      shadowbanUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const start = authService.beginOAuthLogin('google');
    const state = new URL(start.authorizationUrl).searchParams.get('state') ?? '';

    await expect(
      authService.loginWithProvider({
        providerName: 'google',
        code: 'valid-code',
        state,
        oauthCookieValue: start.oauthCookieValue,
      }),
    ).rejects.toThrowError(ForbiddenException);

    try {
      await authService.loginWithProvider({
        providerName: 'google',
        code: 'valid-code',
        state,
        oauthCookieValue: start.oauthCookieValue,
      });
    } catch (err) {
      expect((err as ForbiddenException).getResponse()).toMatchObject({
        code: 'ACCOUNT_BANNED',
      });
    }
  });

  it('rejects tampered or mismatched OAuth state with 400 INVALID_OAUTH_STATE', async () => {
    const start = authService.beginOAuthLogin('google');

    await expect(
      authService.loginWithProvider({
        providerName: 'google',
        code: 'valid-code',
        state: 'tampered-state-value',
        oauthCookieValue: start.oauthCookieValue,
      }),
    ).rejects.toThrowError(BadRequestException);
  });
});
