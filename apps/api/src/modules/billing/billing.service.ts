import { BadRequestException, Injectable } from '@nestjs/common';

export interface SplitCalculationInput {
  courtFeeTotal: number;
  shuttlecockCost: number;
  extraCost?: number;
  presentPlayerCount: number;
}

export interface VietQrInput {
  bankBin: string;
  accountNo: string;
  accountName?: string;
  amount: number;
  transferSyntax: string;
}

@Injectable()
export class BillingService {
  /**
   * Automatically splits court fee, shuttlecock cost, and extra expenses
   * evenly across present players (rounded up to nearest 1,000 VND for clean transfers).
   */
  calculateMatchSplit(input: SplitCalculationInput) {
    const { courtFeeTotal, shuttlecockCost, extraCost = 0, presentPlayerCount } = input;

    if (presentPlayerCount <= 0) {
      throw new BadRequestException('presentPlayerCount must be greater than 0');
    }

    const totalCost = courtFeeTotal + shuttlecockCost + extraCost;
    const rawFeePerPlayer = totalCost / presentPlayerCount;
    const roundedFeePerPlayer = Math.ceil(rawFeePerPlayer / 1000) * 1000;
    const clubFundSurplus = roundedFeePerPlayer * presentPlayerCount - totalCost;

    return {
      totalCost,
      presentPlayerCount,
      rawFeePerPlayer: Math.round(rawFeePerPlayer),
      roundedFeePerPlayer,
      clubFundSurplus,
      currency: 'VND',
    };
  }

  /**
   * Generates a dynamic NAPAS-compliant VietQR image URL with pre-filled
   * bank account, exact debt amount, and standardized transfer syntax.
   */
  buildVietQrCheckout(input: VietQrInput) {
    const baseUrl = process.env.VIETQR_IMAGE_BASE_URL || 'https://img.vietqr.io/image';
    const template = process.env.VIETQR_DEFAULT_TEMPLATE || 'compact2';
    const params = new URLSearchParams({
      amount: String(Math.max(0, Math.round(input.amount))),
      addInfo: input.transferSyntax.trim(),
    });

    if (input.accountName) {
      params.set('accountName', input.accountName.trim());
    }

    const qrImageUrl = `${baseUrl}/${input.bankBin}-${input.accountNo}-${template}.png?${params.toString()}`;

    return {
      qrImageUrl,
      bankBin: input.bankBin,
      accountNo: input.accountNo,
      amount: input.amount,
      transferSyntax: input.transferSyntax,
    };
  }
}
