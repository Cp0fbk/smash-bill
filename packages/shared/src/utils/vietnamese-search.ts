/**
 * Strips Vietnamese diacritics, converts `đ/Đ` to `d`, lowercases, and collapses whitespace
 * for diacritic-insensitive roster & search matching (`minh` matches `Minh`, `Mình`).
 */
export function normalizeSearchText(input?: string | null): string {
  if (!input) {
    return '';
  }

  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if `target` matches `query` case-insensitively and diacritic-insensitively.
 */
export function matchesVietnameseSearch(target?: string | null, query?: string | null): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return true;
  }
  const normalizedTarget = normalizeSearchText(target);
  if (!normalizedTarget) {
    return false;
  }
  return normalizedTarget.includes(normalizedQuery);
}
