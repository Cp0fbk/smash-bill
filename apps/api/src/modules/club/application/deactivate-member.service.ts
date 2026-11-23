import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClubRole } from '@prisma/client';
import type { ClubMemberDto } from '@smash-bill/shared';
import {
  CLUB_MEMBER_REPOSITORY,
  type ClubMemberRepository,
  toClubMemberDto,
} from '../club-member.repository';

@Injectable()
export class DeactivateMemberService {
  constructor(
    @Inject(CLUB_MEMBER_REPOSITORY)
    private readonly memberRepository: ClubMemberRepository,
  ) {}

  async execute(clubId: string, memberId: string): Promise<ClubMemberDto> {
    const existing = await this.memberRepository.findMemberById(clubId, memberId);
    if (!existing) {
      throw new NotFoundException({
        code: 'MEMBER_NOT_FOUND',
        message: 'Club member not found',
      });
    }

    if (existing.role === ClubRole.HOST && existing.isActive) {
      const activeHosts = await this.memberRepository.countActiveHosts(clubId);
      if (activeHosts <= 1) {
        throw new BadRequestException({
          code: 'LAST_HOST_REQUIRED',
          message: 'Cannot deactivate the last active HOST of the club',
        });
      }
    }

    const deactivated = await this.memberRepository.updateMember(clubId, memberId, {
      isActive: false,
    });

    return toClubMemberDto(deactivated);
  }
}
