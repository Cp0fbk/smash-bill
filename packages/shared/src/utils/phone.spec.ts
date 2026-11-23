import { describe, expect, it } from 'vitest';
import { isValidVietnamPhone, normalizePhone } from './phone';
import { encodeQrMatrix, renderQrSvg } from './qr-svg';
import { matchesVietnameseSearch, normalizeSearchText } from './vietnamese-search';

describe('normalizePhone & isValidVietnamPhone', () => {
  it('normalizes spaces, hyphens, dots, and +84 / 84 country prefixes to 0xxxxxxxxx', () => {
    expect(normalizePhone('0912 345 678')).toBe('0912345678');
    expect(normalizePhone('+84912345678')).toBe('0912345678');
    expect(normalizePhone('+84 912-345-678')).toBe('0912345678');
    expect(normalizePhone('84912345678')).toBe('0912345678');
    expect(normalizePhone('098.765.4321')).toBe('0987654321');
    expect(normalizePhone('(090) 123 4567')).toBe('0901234567');
  });

  it('returns null for empty, whitespace, or nullish inputs', () => {
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('   ')).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });

  it('validates normalized Vietnamese phone numbers', () => {
    expect(isValidVietnamPhone('0912 345 678')).toBe(true);
    expect(isValidVietnamPhone('+84987654321')).toBe(true);
    expect(isValidVietnamPhone('12345')).toBe(false);
    expect(isValidVietnamPhone('')).toBe(false);
  });
});

describe('matchesVietnameseSearch', () => {
  it('matches Vietnamese names with or without diacritics (minh finds Minh, Mình)', () => {
    expect(normalizeSearchText('Nguyễn Minh Quân')).toBe('nguyen minh quan');
    expect(normalizeSearchText('Trần Văn Đạt')).toBe('tran van dat');
    expect(matchesVietnameseSearch('Minh', 'minh')).toBe(true);
    expect(matchesVietnameseSearch('Mình', 'minh')).toBe(true);
    expect(matchesVietnameseSearch('Nguyễn Minh Quân', 'minh')).toBe(true);
    expect(matchesVietnameseSearch('Đặng Thành Đạt', 'dat')).toBe(true);
    expect(matchesVietnameseSearch('Đặng Thành Đạt', 'Đạt')).toBe(true);
    expect(matchesVietnameseSearch('Lê Thu Hà', 'minh')).toBe(false);
  });
});

describe('encodeQrMatrix & renderQrSvg', () => {
  it('encodes an invite URL into a valid square QR matrix with 7x7 finder patterns and SVG output', () => {
    const url = 'https://smashbill.vn/join/SAOMAI26';
    const matrix = encodeQrMatrix(url);

    expect(matrix.length).toBeGreaterThanOrEqual(21);
    expect(matrix[0]?.length).toBe(matrix.length);
    // Top-left finder corner module (0,0) and center (3,3) must be dark
    expect(matrix[0]?.[0]).toBe(true);
    expect(matrix[3]?.[3]).toBe(true);

    const svg = renderQrSvg(url, { size: 200 });
    expect(svg).toContain('<svg');
    expect(svg).toContain('width="200"');
    expect(svg).toContain('<path d="M');
  });
});
