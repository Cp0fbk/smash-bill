import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import {
  ACCESS_COOKIE_NAME,
  OAUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  clearOAuthStateCookie,
  clearSessionCookies,
  getCookie,
  setOAuthStateCookie,
  setSessionCookies,
} from './utils/cookies';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly isProd: boolean;
  private readonly webAppUrl: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.isProd = this.configService.get<string>('NODE_ENV') === 'production';
    this.webAppUrl = this.configService.get<string>('WEB_APP_URL') || 'http://localhost:3000';
  }

  @Public()
  @Get('providers')
  @ApiOperation({ summary: 'List supported SSO providers' })
  getSupportedProviders() {
    return this.authService.getSupportedProviders();
  }

  @Public()
  @Get(':provider')
  @ApiOperation({ summary: 'Redirect to OAuth provider authorization URL with PKCE' })
  redirectToProvider(@Param('provider') provider: string, @Res() res: Response): void {
    const { authorizationUrl, oauthCookieValue } = this.authService.beginOAuthLogin(provider);
    setOAuthStateCookie(res, oauthCookieValue, this.isProd);
    res.redirect(HttpStatus.FOUND, authorizationUrl);
  }

  @Public()
  @Get(':provider/callback')
  @ApiOperation({
    summary: 'Verify OAuth state, exchange code, upsert user, set cookies, and redirect to web app',
  })
  async handleCallback(
    @Param('provider') provider: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const oauthCookieValue = getCookie(req, OAUTH_COOKIE_NAME);
    clearOAuthStateCookie(res, this.isProd);

    if (error) {
      res.redirect(HttpStatus.FOUND, `${this.webAppUrl}/login?error=${encodeURIComponent(error)}`);
      return;
    }

    const userAgent =
      typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    const session = await this.authService.loginWithProvider({
      providerName: provider,
      code,
      state,
      oauthCookieValue,
      userAgent,
    });

    setSessionCookies(
      res,
      {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        refreshMaxAgeMs: session.refreshMaxAgeMs,
      },
      this.isProd,
    );

    res.redirect(HttpStatus.FOUND, this.webAppUrl);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate access and refresh token cookies' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = getCookie(req, REFRESH_COOKIE_NAME);
    const userAgent =
      typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    try {
      const rotated = await this.authService.refreshSession(rawRefreshToken, userAgent);

      setSessionCookies(
        res,
        {
          accessToken: rotated.accessToken,
          refreshToken: rotated.refreshToken,
          refreshMaxAgeMs: rotated.refreshMaxAgeMs,
        },
        this.isProd,
      );

      return {
        status: 'ok',
      };
    } catch (error) {
      clearSessionCookies(res, this.isProd);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke refresh token server-side and clear session cookies' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = getCookie(req, REFRESH_COOKIE_NAME);
    const rawAccessToken = getCookie(req, ACCESS_COOKIE_NAME);
    const userId = this.authService.tryExtractUserId(rawAccessToken);

    try {
      await this.authService.logout({
        rawRefreshToken,
        userId,
      });
    } finally {
      clearSessionCookies(res, this.isProd);
    }

    return {
      status: 'ok',
    };
  }
}
