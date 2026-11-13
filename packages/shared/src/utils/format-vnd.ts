/**
 * Formats an integer VND amount as `"65.000 ₫"`.
 * Handles zero, negative credit balances, and large numbers deterministically.
 */
export function formatVnd(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError('amount must be a finite number');
  }

  const normalized = Math.trunc(amount);
  if (normalized === 0) {
    return '0 ₫';
  }

  const sign = normalized < 0 ? '-' : '';
  const absDigits = Math.abs(normalized)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${sign}${absDigits} ₫`;
}
