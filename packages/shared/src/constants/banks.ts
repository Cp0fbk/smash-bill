export interface VnBank {
  code: string;
  bin: string;
  shortName: string;
  name: string;
}

export const VN_BANKS: readonly VnBank[] = [
  {
    code: 'VCB',
    bin: '970436',
    shortName: 'Vietcombank',
    name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
  },
  {
    code: 'TCB',
    bin: '970407',
    shortName: 'Techcombank',
    name: 'Ngân hàng TMCP Kỹ thương Việt Nam',
  },
  {
    code: 'MB',
    bin: '970422',
    shortName: 'MBBank',
    name: 'Ngân hàng TMCP Quân đội',
  },
  {
    code: 'ACB',
    bin: '970416',
    shortName: 'ACB',
    name: 'Ngân hàng TMCP Á Châu',
  },
  {
    code: 'BIDV',
    bin: '970418',
    shortName: 'BIDV',
    name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
  },
  {
    code: 'ICB',
    bin: '970415',
    shortName: 'VietinBank',
    name: 'Ngân hàng TMCP Công thương Việt Nam',
  },
  {
    code: 'VPB',
    bin: '970432',
    shortName: 'VPBank',
    name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
  },
  {
    code: 'TPB',
    bin: '970423',
    shortName: 'TPBank',
    name: 'Ngân hàng TMCP Tiên Phong',
  },
  {
    code: 'STB',
    bin: '970403',
    shortName: 'Sacombank',
    name: 'Ngân hàng TMCP Sài Gòn Thương Tín',
  },
  {
    code: 'VIB',
    bin: '970441',
    shortName: 'VIB',
    name: 'Ngân hàng TMCP Quốc tế Việt Nam',
  },
  {
    code: 'HDB',
    bin: '970437',
    shortName: 'HDBank',
    name: 'Ngân hàng TMCP Phát triển TP. Hồ Chí Minh',
  },
  {
    code: 'SHB',
    bin: '970443',
    shortName: 'SHB',
    name: 'Ngân hàng TMCP Sài Gòn - Hà Nội',
  },
  {
    code: 'MSB',
    bin: '970426',
    shortName: 'MSB',
    name: 'Ngân hàng TMCP Hàng Hải Việt Nam',
  },
  {
    code: 'OCB',
    bin: '970448',
    shortName: 'OCB',
    name: 'Ngân hàng TMCP Phương Đông',
  },
  {
    code: 'LPB',
    bin: '970449',
    shortName: 'LPBank',
    name: 'Ngân hàng TMCP Lộc Phát Việt Nam',
  },
  {
    code: 'SEAB',
    bin: '970440',
    shortName: 'SeABank',
    name: 'Ngân hàng TMCP Đông Nam Á',
  },
  {
    code: 'EIB',
    bin: '970431',
    shortName: 'Eximbank',
    name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam',
  },
] as const;

export function findBankByBin(bin: string): VnBank | undefined {
  return VN_BANKS.find((bank) => bank.bin === bin);
}

export function findBankByCode(code: string): VnBank | undefined {
  const normalized = code.trim().toUpperCase();
  return VN_BANKS.find((bank) => bank.code === normalized);
}
