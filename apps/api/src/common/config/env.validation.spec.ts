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
