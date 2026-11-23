import { Inject, Injectable } from '@nestjs/common';
import { type ClubMemberDto, matchesVietnameseSearch, normalizePhone } from '@smash-bill/shared';
import {
  CLUB_MEMBER_REPOSITORY,
  type ClubMemberRepository,
  toClubMemberDto,
} from '../club-member.repository';
import type { ListMembersQueryDto } from '../dto/list-members-query.dto';

@Injectable()
export class ListMembersService {
  constructor(
    @Inject(CLUB_MEMBER_REPOSITORY)
    private readonly memberRepository: ClubMemberRepository,
  ) {}

  async execute(clubId: string, query?: ListMembersQueryDto): Promise<ClubMemberDto[]> {
    const activeFilter =
      query?.active === 'true' ? true : query?.active === 'false' ? false : undefined;

    const members = await this.memberRepository.findMembersByClub(clubId, {
      role: query?.role,
      active: activeFilter,
    });

    const q = query?.q?.trim();
    if (!q) {
      return members.map(toClubMemberDto);
    }

    const normalizedQueryPhone = normalizePhone(q);

    return members
      .filter((member) => {
        if (matchesVietnameseSearch(member.displayName, q)) {
          return true;
        }
        if (member.phone) {
          if (member.phone.includes(q)) {
            return true;
          }
          if (normalizedQueryPhone && member.phone.includes(normalizedQueryPhone)) {
            return true;
          }
        }
        return false;
      })
      .map(toClubMemberDto);
  }
}
