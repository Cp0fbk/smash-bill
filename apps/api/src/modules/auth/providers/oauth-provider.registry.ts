import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { AuthProvider } from '@prisma/client';
import { OAUTH_PROVIDERS, type OAuthProvider } from '../domain/oauth-provider';

@Injectable()
export class OAuthProviderRegistry {
  private readonly providersByName = new Map<string, OAuthProvider>();

  constructor(@Inject(OAUTH_PROVIDERS) providers: OAuthProvider[]) {
    for (const provider of providers) {
      this.providersByName.set(provider.name.toUpperCase(), provider);
    }
  }

  get(name: string): OAuthProvider {
    const normalized = name.trim().toUpperCase();
    const provider = this.providersByName.get(normalized);

    if (!provider) {
      throw new BadRequestException({
        code: 'UNSUPPORTED_OAUTH_PROVIDER',
        message: `Unsupported OAuth provider: ${name}`,
      });
    }

    return provider;
  }

  list(): AuthProvider[] {
    return Array.from(this.providersByName.values()).map((provider) => provider.name);
  }
}
