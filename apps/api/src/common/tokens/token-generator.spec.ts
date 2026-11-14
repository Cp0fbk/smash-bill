import { describe, expect, it } from 'vitest';
import { DEFAULT_PUBLIC_TOKEN_LENGTH, NanoidTokenGenerator } from './token-generator';

describe('NanoidTokenGenerator', () => {
  const generator = new NanoidTokenGenerator();

  it('generates URL-safe 21-character tokens', () => {
    const token = generator.generate();
    expect(token).toHaveLength(DEFAULT_PUBLIC_TOKEN_LENGTH);
    expect(token).toMatch(/^[A-Za-z0-9_-]{21}$/);
  });

  it('generates unique tokens across invocations', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generator.generate()));
    expect(tokens.size).toBe(100);
  });
});
