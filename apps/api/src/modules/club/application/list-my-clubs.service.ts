import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ClubRole } from '@prisma/client';
import type { ClubDetail, ClubSummary } from '@smash-bill/shared';
import { CLUB_REPOSITORY, type ClubRepository, toClubSummaryDto } from '../club.repository';

@Injectable()
export class ListMyClubsService {
  constructor(@Inject(CLUB_REPOSITORY) private readonly clubRepository: ClubRepository) {}

  async execute(userId: string): Promise<ClubSummary[]> {
    const rows = await this.clubRepository.findClubsByUserId(userId);
    return rows.map((row) => toClubSummaryDto(row.club, row.myRole));
  }

  async getById(clubId: string, myRole: ClubRole): Promise<ClubDetail> {
    const club = await this.clubRepository.findClubById(clubId);
    if (!club) {
      throw new NotFoundException({
        code: 'CLUB_NOT_FOUND',
        message: 'Club not found',
      });
    }

    return toClubSummaryDto(club, myRole);
  }
}
