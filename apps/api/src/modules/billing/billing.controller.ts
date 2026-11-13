import { Body, Controller, Post } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('preview-split')
  previewSplit(
    @Body()
    payload: {
      courtFeeTotal: number;
      shuttlecockCost: number;
      extraCost?: number;
      presentPlayerCount: number;
    },
  ) {
    return this.billingService.calculateMatchSplit(payload);
  }

  @Post('vietqr')
  generateVietQr(
    @Body()
    payload: {
      bankBin: string;
      accountNo: string;
      accountName?: string;
      amount: number;
      transferSyntax: string;
    },
  ) {
    return this.billingService.buildVietQrCheckout(payload);
  }
}
