import { ApiProperty } from '@nestjs/swagger';
import { BANKS, toTransferSyntax } from '@smash-bill/shared';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

const SUPPORTED_BANK_BINS = BANKS.map((bank) => bank.bin);

export class UpdateBankAccountDto {
  @ApiProperty({
    example: '970436',
    description: 'NAPAS Bank BIN from shared BANKS list (e.g., 970436 for Vietcombank)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsIn(SUPPORTED_BANK_BINS, {
    message: 'Invalid or unsupported bank BIN. Choose a valid Vietnamese bank from BANKS list.',
  })
  bankBin!: string;

  @ApiProperty({
    example: '0071001234567',
    description: '6 to 19 numeric digits bank account number',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^[0-9]{6,19}$/, {
    message: 'bankAccountNo must contain 6 to 19 numeric digits',
  })
  bankAccountNo!: string;

  @ApiProperty({
    example: 'NGUYEN MINH QUAN',
    description: 'Account holder name (normalized to uppercase ASCII via toTransferSyntax)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? toTransferSyntax(value, 50) : value))
  @IsString()
  @IsNotEmpty({ message: 'bankAccountName must contain valid alphanumeric characters' })
  @MaxLength(50)
  bankAccountName!: string;
}
