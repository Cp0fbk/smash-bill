import { Module } from '@nestjs/common';
import { CreateClubService } from './application/create-club.service';
import { ListMyClubsService } from './application/list-my-clubs.service';
import { RotateClubTokensService } from './application/rotate-club-tokens.service';
import { UpdateBankAccountService } from './application/update-bank-account.service';
import { UpdateClubService } from './application/update-club.service';
import { ClubController } from './club.controller';
import { CLUB_REPOSITORY } from './club.repository';
import { SlugService } from './domain/slug.service';
import { ClubRoleGuard } from './guards/club-role.guard';
import { PrismaClubRepository } from './infrastructure/prisma-club.repository';

@Module({
  controllers: [ClubController],
  providers: [
    {
      provide: CLUB_REPOSITORY,
      useClass: PrismaClubRepository,
    },
    SlugService,
    ClubRoleGuard,
    CreateClubService,
    ListMyClubsService,
    UpdateClubService,
    UpdateBankAccountService,
    RotateClubTokensService,
  ],
  exports: [CLUB_REPOSITORY, ClubRoleGuard, SlugService],
})
export class ClubModule {}
