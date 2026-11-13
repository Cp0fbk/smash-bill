/**
 * Converts a string (including Vietnamese text) into a URL-safe lowercase kebab-case slug.
 */
export function slugify(input: string): string {
  if (!input) {
    return '';
  }

  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
