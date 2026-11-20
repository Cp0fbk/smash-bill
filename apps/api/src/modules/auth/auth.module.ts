import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OAUTH_PROVIDERS, type OAuthProvider } from './domain/oauth-provider';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MeController } from './me.controller';
import { GoogleOAuthProvider } from './providers/google-oauth.provider';
import { OAuthProviderRegistry } from './providers/oauth-provider.registry';
import { TokenService } from './token.service';

@Module({
  controllers: [AuthController, MeController],
  providers: [
    GoogleOAuthProvider,
    {
      provide: OAUTH_PROVIDERS,
      useFactory: (googleProvider: GoogleOAuthProvider): OAuthProvider[] => [googleProvider],
      inject: [GoogleOAuthProvider],
    },
    OAuthProviderRegistry,
    TokenService,
    AuthService,
    JwtAuthGuard,
  ],
  exports: [AuthService, TokenService, JwtAuthGuard, OAuthProviderRegistry],
})
export class AuthModule {}
