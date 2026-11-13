import { describe, expect, it } from 'vitest';
import { slugify } from './slugify';
import { toTransferSyntax } from './transfer-syntax';

describe('toTransferSyntax', () => {
  it('converts Vietnamese names with diacritics to uppercase ASCII', () => {
    expect(toTransferSyntax('Nguyễn Minh')).toBe('NGUYEN MINH');
    expect(toTransferSyntax('Trần Hoàng Bảo')).toBe('TRAN HOANG BAO');
  });

  it('converts đ and Đ to D', () => {
    expect(toTransferSyntax('Đặng Quốc Đạt')).toBe('DANG QUOC DAT');
    expect(toTransferSyntax('Cầu lông Thủ Đức')).toBe('CAU LONG THU DUC');
  });

  it('collapses multiple spaces and trims whitespace', () => {
    expect(toTransferSyntax('   Nguyễn    Văn   Minh  ')).toBe('NGUYEN VAN MINH');
  });

  it('removes non [A-Z0-9 ] characters', () => {
    expect(toTransferSyntax('SB: CLB #1 - T11/2026!')).toBe('SB CLB 1 T112026');
    expect(toTransferSyntax('Minh (Khách) @2026')).toBe('MINH KHACH 2026');
  });

  it('truncates output to 25 characters by default without trailing space', () => {
    const result = toTransferSyntax('SB CAU LONG THU DUC NGUYEN VAN MINH 1126');
    expect(result.length).toBeLessThanOrEqual(25);
    expect(result).toBe('SB CAU LONG THU DUC NGUYE');
  });

  it('handles empty or non-alphanumeric input gracefully', () => {
    expect(toTransferSyntax('')).toBe('');
    expect(toTransferSyntax('!@#$%^&*()')).toBe('');
  });
});

describe('slugify', () => {
  it('creates lowercase kebab-case slugs from Vietnamese club names', () => {
    expect(slugify('CLB Cầu Lông Thủ Đức #1')).toBe('clb-cau-long-thu-duc-1');
    expect(slugify('  Đội Đánh Cầu Tối Thứ 3 & 5 ')).toBe('doi-danh-cau-toi-thu-3-5');
  });
});
