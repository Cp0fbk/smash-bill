export const MONEY_ROUNDING_UNIT = 1000 as const;
export const CURRENCY = 'VND' as const;

export type CurrencyCode = typeof CURRENCY;

/**
 * Rounds a raw VND amount up to the nearest `MONEY_ROUNDING_UNIT` (1,000 VND).
 */
export function roundUpVnd(amount: number, unit: number = MONEY_ROUNDING_UNIT): number {
  if (!Number.isFinite(amount)) {
    throw new RangeError('amount must be a finite number');
  }
  if (amount <= 0) {
    return 0;
  }
  return Math.ceil(amount / unit) * unit;
}
