import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getSupportedProviders() {
    return {
      passwordLoginEnabled: false,
      providers: ['GOOGLE', 'ZALO'],
      note: 'Mandatory SSO login to ensure real player identities and prevent spam/bot accounts.',
    };
  }
}
