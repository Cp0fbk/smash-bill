import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('preview-split')
  @ApiOperation({ summary: 'Preview equal match fee split rounded up to 1,000 VND' })
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
  @ApiOperation({ summary: 'Generate dynamic VietQR checkout link' })
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
