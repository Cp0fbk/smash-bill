import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClubRole } from '@prisma/client';
import { type ClubDetail, findBankByBin, toTransferSyntax } from '@smash-bill/shared';
import { CLUB_REPOSITORY, type ClubRepository, toClubSummaryDto } from '../club.repository';
import type { UpdateBankAccountDto } from '../dto/update-bank-account.dto';

@Injectable()
export class UpdateBankAccountService {
  constructor(@Inject(CLUB_REPOSITORY) private readonly clubRepository: ClubRepository) {}

  async execute(clubId: string, dto: UpdateBankAccountDto): Promise<ClubDetail> {
    const bank = findBankByBin(dto.bankBin);
    if (!bank) {
      throw new BadRequestException({
        code: 'INVALID_BANK_BIN',
        message: 'Invalid or unsupported bank BIN',
      });
    }

    const normalizedName = toTransferSyntax(dto.bankAccountName, 50);
    if (!normalizedName) {
      throw new BadRequestException({
        code: 'INVALID_BANK_ACCOUNT_NAME',
        message: 'Bank account holder name must contain valid ASCII characters',
      });
    }

    const updated = await this.clubRepository.updateBankAccount(clubId, {
      bankBin: bank.bin,
      bankAccountNo: dto.bankAccountNo.trim(),
      bankAccountName: normalizedName,
    });

    return toClubSummaryDto(updated, ClubRole.HOST);
  }
}
