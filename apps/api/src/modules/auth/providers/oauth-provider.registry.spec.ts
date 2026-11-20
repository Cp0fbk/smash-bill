import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import type { OAuthProfile, OAuthProvider } from '../domain/oauth-provider';
import { GoogleOAuthProvider, derivePkceCodeChallenge } from './google-oauth.provider';
import { OAuthProviderRegistry } from './oauth-provider.registry';

class FakeGoogleProvider implements OAuthProvider {
  readonly name = AuthProvider.GOOGLE;

  getAuthorizationUrl(params: { state: string; codeVerifier: string }): string {
    return `https://accounts.google.com/o/oauth2/v2/auth?state=${params.state}`;
  }

  async exchangeCode(_params: { code: string; codeVerifier: string }): Promise<OAuthProfile> {
    return {
      provider: AuthProvider.GOOGLE,
      providerId: 'google-sub-1',
      email: 'minh@saomai.club',
      name: 'Minh Nguyen',
    };
  }
}

describe('OAuthProviderRegistry & GoogleOAuthProvider', () => {
  it('resolves registered provider case-insensitively and lists providers', () => {
    const fakeGoogle = new FakeGoogleProvider();
    const registry = new OAuthProviderRegistry([fakeGoogle]);

    expect(registry.get('google')).toBe(fakeGoogle);
    expect(registry.get('GOOGLE')).toBe(fakeGoogle);
    expect(registry.list()).toEqual([AuthProvider.GOOGLE]);
  });

  it('throws 400 UNSUPPORTED_OAUTH_PROVIDER for unknown or unregistered providers', () => {
    const registry = new OAuthProviderRegistry([new FakeGoogleProvider()]);

    expect(() => registry.get('zalo')).toThrowError(BadRequestException);
    try {
      registry.get('github');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toMatchObject({
        code: 'UNSUPPORTED_OAUTH_PROVIDER',
      });
    }
  });

  it('builds Google authorization URL with PKCE S256 challenge and state', () => {
    const config = new ConfigService({
      GOOGLE_CLIENT_ID: 'test-google-client-id.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: 'test-google-secret',
      GOOGLE_CALLBACK_URL: 'http://localhost:4000/api/v1/auth/google/callback',
    });
    const provider = new GoogleOAuthProvider(config);

    const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const expectedChallenge = derivePkceCodeChallenge(codeVerifier);
    const url = new URL(
      provider.getAuthorizationUrl({
        state: 'state-123',
        codeVerifier,
      }),
    );

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('client_id')).toBe(
      'test-google-client-id.apps.googleusercontent.com',
    );
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:4000/api/v1/auth/google/callback',
    );
    expect(url.searchParams.get('state')).toBe('state-123');
    expect(url.searchParams.get('code_challenge')).toBe(expectedChallenge);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  });

  it('throws 400 OAUTH_NOT_CONFIGURED when GOOGLE_CLIENT_ID is empty', () => {
    const config = new ConfigService({
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CALLBACK_URL: 'http://localhost:4000/api/v1/auth/google/callback',
    });
    const provider = new GoogleOAuthProvider(config);

    expect(() =>
      provider.getAuthorizationUrl({
        state: 'state-123',
        codeVerifier: 'verifier-123',
      }),
    ).toThrowError(BadRequestException);
  });
});
