import { MAX_TRANSFER_NOTE_LENGTH } from '../constants/vietqr';

/**
 * Normalizes a Vietnamese string into NAPAS-compatible uppercase ASCII transfer syntax.
 * - Converts `đ/Đ` -> `D` and strips diacritics
 * - Removes non `[A-Z0-9 ]` characters
 * - Collapses multiple spaces and trims
 * - Truncates to `maxLength` (default 25 chars)
 */
export function toTransferSyntax(
  input: string,
  maxLength: number = MAX_TRANSFER_NOTE_LENGTH,
): string {
  if (!input || maxLength <= 0) {
    return '';
  }

  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
    .trim();
}
