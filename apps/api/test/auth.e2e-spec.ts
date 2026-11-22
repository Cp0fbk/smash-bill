import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AccountStatus, AuthProvider } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import {
  OAUTH_PROVIDERS,
  type OAuthProfile,
  type OAuthProvider,
} from '../src/modules/auth/domain/oauth-provider';
import { type TestDatabaseContext, startTestDatabase } from './utils/test-db';

class FakeGoogleOAuthProvider implements OAuthProvider {
  readonly name = AuthProvider.GOOGLE;
  public profile: OAuthProfile = {
    provider: AuthProvider.GOOGLE,
    providerId: 'google-e2e-sub-001',
    email: 'minh.admin@saomai.club',
    name: 'Minh Nguyen (Admin)',
    avatarUrl: 'https://example.com/minh-avatar.png',
  };

  getAuthorizationUrl(params: { state: string; codeVerifier: string }): string {
    return `https://fake-google.example.com/oauth2/auth?state=${encodeURIComponent(params.state)}`;
  }

  async exchangeCode(_params: { code: string; codeVerifier: string }): Promise<OAuthProfile> {
    return this.profile;
  }
}

function extractCookieValue(setCookieHeaders: string[] | string | undefined, name: string): string {
  const headers = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : setCookieHeaders
      ? [setCookieHeaders]
      : [];

  for (const header of headers) {
    const firstSegment = header.split(';')[0] ?? '';
    const [key, ...rest] = firstSegment.split('=');
    if (key?.trim() === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return '';
}

describe('Auth SSO, Rotating Refresh Tokens & /me E2E', () => {
  let db: TestDatabaseContext;
  let app: INestApplication;
  let fakeGoogleProvider: FakeGoogleOAuthProvider;

  beforeAll(async () => {
    db = await startTestDatabase();
    fakeGoogleProvider = new FakeGoogleOAuthProvider();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OAUTH_PROVIDERS)
      .useValue([fakeGoogleProvider])
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  beforeEach(async () => {
    await db.truncate();
    fakeGoogleProvider.profile = {
      provider: AuthProvider.GOOGLE,
      providerId: 'google-e2e-sub-001',
      email: 'minh.admin@saomai.club',
      name: 'Minh Nguyen (Admin)',
      avatarUrl: 'https://example.com/minh-avatar.png',
    };
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (db) {
      await db.stop();
    }
  });

  it('GET /api/v1/me returns 401 when unauthenticated', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/me').expect(401);
    expect(res.body).toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('completes OAuth callback with fake provider, sets cookies, returns 200 on /me, rotates tokens, and invalidates refresh token on logout', async () => {
    // 1. Start OAuth flow
    const startRes = await request(app.getHttpServer()).get('/api/v1/auth/google').expect(302);
    const redirectLocation = startRes.headers.location;
    expect(redirectLocation).toContain('https://fake-google.example.com/oauth2/auth?state=');

    const state = new URL(redirectLocation).searchParams.get('state') ?? '';
    const oauthCookie = extractCookieValue(startRes.headers['set-cookie'], 'sb_oauth');
    expect(oauthCookie).toBeTruthy();

    // 2. Tampered state must return 400
    await request(app.getHttpServer())
      .get('/api/v1/auth/google/callback')
      .query({ code: 'fake-code-123', state: 'wrong-state' })
      .set('Cookie', [`sb_oauth=${encodeURIComponent(oauthCookie)}`])
      .expect(400);

    // 3. Valid callback exchanges code, sets sb_access + sb_refresh cookies, redirects to WEB_APP_URL
    const callbackRes = await request(app.getHttpServer())
      .get('/api/v1/auth/google/callback')
      .query({ code: 'fake-code-123', state })
      .set('Cookie', [`sb_oauth=${encodeURIComponent(oauthCookie)}`])
      .expect(302);

    expect(callbackRes.headers.location).toBe('http://localhost:3000');

    const accessCookie1 = extractCookieValue(callbackRes.headers['set-cookie'], 'sb_access');
    const refreshCookie1 = extractCookieValue(callbackRes.headers['set-cookie'], 'sb_refresh');
    expect(accessCookie1).toBeTruthy();
    expect(refreshCookie1).toBeTruthy();

    // 4. GET /api/v1/me returns 200 with authenticated user profile
    const meRes = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Cookie', [`sb_access=${encodeURIComponent(accessCookie1)}`])
      .expect(200);

    expect(meRes.body).toMatchObject({
      provider: 'GOOGLE',
      providerId: 'google-e2e-sub-001',
      role: 'USER',
      email: 'minh.admin@saomai.club',
      name: 'Minh Nguyen (Admin)',
      preferredCity: null,
      status: 'ACTIVE',
    });

    // 5. POST /api/v1/auth/refresh rotates refresh token and issues new cookies
    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', [`sb_refresh=${encodeURIComponent(refreshCookie1)}`])
      .expect(200);

    const accessCookie2 = extractCookieValue(refreshRes.headers['set-cookie'], 'sb_access');
    const refreshCookie2 = extractCookieValue(refreshRes.headers['set-cookie'], 'sb_refresh');
    expect(accessCookie2).toBeTruthy();
    expect(refreshCookie2).toBeTruthy();
    expect(refreshCookie2).not.toBe(refreshCookie1);

    // 6. POST /api/v1/auth/logout invalidates refresh token server-side
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', [
        `sb_access=${encodeURIComponent(accessCookie2)}`,
        `sb_refresh=${encodeURIComponent(refreshCookie2)}`,
      ])
      .expect(200);

    const activeTokens = await db.prisma.refreshToken.count({
      where: { revokedAt: null },
    });
    expect(activeTokens).toBe(0);

    // Refreshing with the logged-out token fails with 401
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', [`sb_refresh=${encodeURIComponent(refreshCookie2)}`])
      .expect(401);
  });

  it('rejects BANNED users on callback with 403 ACCOUNT_BANNED', async () => {
    await db.prisma.user.create({
      data: {
        provider: AuthProvider.GOOGLE,
        providerId: 'google-e2e-sub-001',
        email: 'minh.admin@saomai.club',
        name: 'Banned Player',
        status: AccountStatus.BANNED,
      },
    });

    const startRes = await request(app.getHttpServer()).get('/api/v1/auth/google').expect(302);
    const state = new URL(startRes.headers.location).searchParams.get('state') ?? '';
    const oauthCookie = extractCookieValue(startRes.headers['set-cookie'], 'sb_oauth');

    const callbackRes = await request(app.getHttpServer())
      .get('/api/v1/auth/google/callback')
      .query({ code: 'fake-code-banned', state })
      .set('Cookie', [`sb_oauth=${encodeURIComponent(oauthCookie)}`])
      .expect(403);

    expect(callbackRes.body).toMatchObject({
      code: 'ACCOUNT_BANNED',
    });
  });
});
