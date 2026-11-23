import { Module } from '@nestjs/common';
import { AddMemberService } from './application/add-member.service';
import { CreateClubService } from './application/create-club.service';
import { DeactivateMemberService } from './application/deactivate-member.service';
import { JoinByInviteService } from './application/join-by-invite.service';
import { ListMembersService } from './application/list-members.service';
import { ListMyClubsService } from './application/list-my-clubs.service';
import { RotateClubTokensService } from './application/rotate-club-tokens.service';
import { UpdateBankAccountService } from './application/update-bank-account.service';
import { UpdateClubService } from './application/update-club.service';
import { UpdateMemberService } from './application/update-member.service';
import { CLUB_MEMBER_REPOSITORY } from './club-member.repository';
import { ClubController } from './club.controller';
import { CLUB_REPOSITORY } from './club.repository';
import { SlugService } from './domain/slug.service';
import { ClubRoleGuard } from './guards/club-role.guard';
import { PrismaClubMemberRepository } from './infrastructure/prisma-club-member.repository';
import { PrismaClubRepository } from './infrastructure/prisma-club.repository';
import { PublicInviteController } from './public-invite.controller';

@Module({
  controllers: [ClubController, PublicInviteController],
  providers: [
    {
      provide: CLUB_REPOSITORY,
      useClass: PrismaClubRepository,
    },
    {
      provide: CLUB_MEMBER_REPOSITORY,
      useClass: PrismaClubMemberRepository,
    },
    SlugService,
    ClubRoleGuard,
    CreateClubService,
    ListMyClubsService,
    UpdateClubService,
    UpdateBankAccountService,
    RotateClubTokensService,
    ListMembersService,
    AddMemberService,
    UpdateMemberService,
    DeactivateMemberService,
    JoinByInviteService,
  ],
  exports: [CLUB_REPOSITORY, CLUB_MEMBER_REPOSITORY, ClubRoleGuard, SlugService],
})
export class ClubModule {}
