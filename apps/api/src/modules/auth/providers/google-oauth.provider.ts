import { createHash } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '@prisma/client';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import type { OAuthProfile, OAuthProvider } from '../domain/oauth-provider';

export function derivePkceCodeChallenge(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}

@Injectable()
export class GoogleOAuthProvider implements OAuthProvider {
  readonly name = AuthProvider.GOOGLE;
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
    const callbackUrl =
      this.configService.get<string>('GOOGLE_CALLBACK_URL') ??
      'http://localhost:4000/api/v1/auth/google/callback';

    this.client = new OAuth2Client(this.clientId, clientSecret, callbackUrl);
  }

  getAuthorizationUrl(params: { state: string; codeVerifier: string }): string {
    const codeChallenge = derivePkceCodeChallenge(params.codeVerifier);

    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      state: params.state,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
      prompt: 'select_account',
    });
  }

  async exchangeCode(params: { code: string; codeVerifier: string }): Promise<OAuthProfile> {
    const { tokens } = await this.client.getToken({
      code: params.code,
      codeVerifier: params.codeVerifier,
    });

    if (!tokens.id_token) {
      throw new UnauthorizedException({
        code: 'INVALID_OAUTH_TOKEN',
        message: 'Google token response did not include an id_token',
      });
    }

    const ticket = await this.client.verifyIdToken({
      idToken: tokens.id_token,
      audience: this.clientId || undefined,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub) {
      throw new UnauthorizedException({
        code: 'INVALID_OAUTH_PROFILE',
        message: 'Google ID token payload is missing subject identifier',
      });
    }

    const fallbackName = payload.email ? payload.email.split('@')[0] : 'Google Player';
    const name = payload.name?.trim() || fallbackName;

    return {
      provider: AuthProvider.GOOGLE,
      providerId: payload.sub,
      ...(payload.email ? { email: payload.email } : {}),
      name,
      ...(payload.picture ? { avatarUrl: payload.picture } : {}),
    };
  }
}
