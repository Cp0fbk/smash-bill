import { describe, expect, it } from 'vitest';
import { formatVnd } from './format-vnd';

describe('formatVnd', () => {
  it('formats standard positive VND amounts with dot separator and ₫ suffix', () => {
    expect(formatVnd(65000)).toBe('65.000 ₫');
    expect(formatVnd(1000)).toBe('1.000 ₫');
  });

  it('formats zero and negative zero cleanly', () => {
    expect(formatVnd(0)).toBe('0 ₫');
    expect(formatVnd(-0)).toBe('0 ₫');
  });

  it('formats negative numbers (credit balance)', () => {
    expect(formatVnd(-50000)).toBe('-50.000 ₫');
    expect(formatVnd(-1250000)).toBe('-1.250.000 ₫');
  });

  it('formats very large numbers accurately', () => {
    expect(formatVnd(12500000)).toBe('12.500.000 ₫');
    expect(formatVnd(1234567890)).toBe('1.234.567.890 ₫');
  });

  it('truncates fractional parts if passed', () => {
    expect(formatVnd(65000.99)).toBe('65.000 ₫');
  });

  it('throws RangeError for non-finite values', () => {
    expect(() => formatVnd(Number.NaN)).toThrow(RangeError);
    expect(() => formatVnd(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
