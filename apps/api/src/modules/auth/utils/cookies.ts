import type { CookieOptions, Request, Response } from 'express';
import { OAUTH_STATE_TTL_SECONDS } from '../token.service';

export const LEGACY_ACCESS_COOKIE_NAME = 'sb_access';
export const SESSION_COOKIE_NAME = 'sb_session';
export const REFRESH_COOKIE_NAME = 'sb_refresh';
export const OAUTH_COOKIE_NAME = 'sb_oauth';
export const AUTH_COOKIE_PATH = '/api/v1/auth';

export function parseCookies(req: Request): Record<string, string> {
  const rawHeader = req.headers.cookie;
  if (!rawHeader || typeof rawHeader !== 'string') {
    return {};
  }

  const parsed: Record<string, string> = {};
  for (const part of rawHeader.split(';')) {
    const eqIndex = part.indexOf('=');
    if (eqIndex <= 0) {
      continue;
    }
    const key = part.slice(0, eqIndex).trim();
    const rawValue = part.slice(eqIndex + 1).trim();
    if (!key) {
      continue;
    }
    try {
      parsed[key] = decodeURIComponent(rawValue);
    } catch {
      parsed[key] = rawValue;
    }
  }
  return parsed;
}

export function getCookie(req: Request, name: string): string | undefined {
  const cookies = parseCookies(req);
  return cookies[name];
}

function baseCookieOptions(isProd: boolean, path = '/'): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path,
  };
}

export function setOAuthStateCookie(res: Response, value: string, isProd: boolean): void {
  res.cookie(OAUTH_COOKIE_NAME, value, {
    ...baseCookieOptions(isProd, AUTH_COOKIE_PATH),
    maxAge: OAUTH_STATE_TTL_SECONDS * 1000,
  });
}

export function clearOAuthStateCookie(res: Response, isProd: boolean): void {
  res.clearCookie(OAUTH_COOKIE_NAME, baseCookieOptions(isProd, AUTH_COOKIE_PATH));
}

export function setRefreshSessionCookies(
  res: Response,
  tokens: { refreshToken: string; refreshMaxAgeMs: number },
  isProd: boolean,
): void {
  // Store only the rotating refresh token in an HttpOnly cookie scoped to /api/v1/auth,
  // plus a non-secret HttpOnly session indicator cookie so Next.js middleware can gate routes.
  // The short-lived 15m JWT access token is kept strictly in JS memory (Bearer header).
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    ...baseCookieOptions(isProd, AUTH_COOKIE_PATH),
    maxAge: tokens.refreshMaxAgeMs,
  });

  res.cookie(SESSION_COOKIE_NAME, '1', {
    ...baseCookieOptions(isProd, '/'),
    maxAge: tokens.refreshMaxAgeMs,
  });

  // Clean up any legacy sb_access cookie from earlier sessions.
  res.clearCookie(LEGACY_ACCESS_COOKIE_NAME, baseCookieOptions(isProd, '/'));
}

export function clearSessionCookies(res: Response, isProd: boolean): void {
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions(isProd, AUTH_COOKIE_PATH));
  res.clearCookie(SESSION_COOKIE_NAME, baseCookieOptions(isProd, '/'));
  res.clearCookie(LEGACY_ACCESS_COOKIE_NAME, baseCookieOptions(isProd, '/'));
}
