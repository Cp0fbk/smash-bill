import { BadRequestException, Injectable } from '@nestjs/common';
import {
  type SplitCalculationInput,
  type SplitCalculationResult,
  calculateMatchSplit as calculateDomainMatchSplit,
} from './domain/split-cost';

export type { SplitCalculationInput, SplitCalculationResult };

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
  calculateMatchSplit(input: SplitCalculationInput): SplitCalculationResult {
    try {
      return calculateDomainMatchSplit(input);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid split calculation input',
      );
    }
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
