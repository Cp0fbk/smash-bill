/**
 * Normalizes a Vietnamese phone number string into a canonical 10-digit format (e.g., `0912345678`).
 *
 * Examples:
 * - `"0912 345 678"` -> `"0912345678"`
 * - `"+84912345678"` -> `"0912345678"`
 * - `"84 912-345-678"` -> `"0912345678"`
 * - `""` / `null` / `undefined` -> `null`
 */
export function normalizePhone(input?: string | null): string | null {
  if (!input) {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // Strip common formatting characters: spaces, dots, hyphens, parentheses
  const cleaned = trimmed.replace(/[\s.\-()]/g, '');
  if (!cleaned) {
    return null;
  }

  if (cleaned.startsWith('+84')) {
    const rest = cleaned.slice(3);
    return rest.startsWith('0') ? rest : `0${rest}`;
  }

  if (cleaned.startsWith('84') && cleaned.length === 11 && /^[35789]/.test(cleaned.slice(2))) {
    return `0${cleaned.slice(2)}`;
  }

  return cleaned;
}

/**
 * Checks whether a phone string is a valid Vietnamese phone number after normalization.
 */
export function isValidVietnamPhone(input?: string | null): boolean {
  const normalized = normalizePhone(input);
  if (!normalized) {
    return false;
  }
  return /^0\d{9,10}$/.test(normalized);
}
