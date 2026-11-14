import type { AuthProvider } from '@prisma/client';

export interface OAuthProfile {
  provider: AuthProvider;
  providerId: string;
  email?: string;
  name: string;
  avatarUrl?: string;
}

export interface OAuthProvider {
  readonly name: AuthProvider;
  getAuthorizationUrl(params: { state: string; codeVerifier: string }): string;
  exchangeCode(params: { code: string; codeVerifier: string }): Promise<OAuthProfile>;
}

export const OAUTH_PROVIDERS = Symbol('OAUTH_PROVIDERS');
