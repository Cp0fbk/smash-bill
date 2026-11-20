import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { NodeEnvironment, validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('validates a complete configuration and applies defaults', () => {
    const env = validateEnv({
      DATABASE_URL: 'postgresql://smashbill:secret@localhost:5432/smashbill',
    });

    expect(env.DATABASE_URL).toBe('postgresql://smashbill:secret@localhost:5432/smashbill');
    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe(NodeEnvironment.Development);
    expect(env.JWT_ACCESS_SECRET).toBe('dev-jwt-access-secret-change-in-production');
    expect(env.JWT_REFRESH_TTL_DAYS).toBe(30);
    expect(env.WEB_APP_URL).toBe('http://localhost:3000');
    expect(env.GOOGLE_CALLBACK_URL).toBe('http://localhost:4000/api/v1/auth/google/callback');
  });

  it('throws a clear error message when DATABASE_URL is missing', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
  });

  it('throws when PORT is out of valid range', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://smashbill:secret@localhost:5432/smashbill',
        PORT: '99999',
      }),
    ).toThrow(/PORT/);
  });
});
