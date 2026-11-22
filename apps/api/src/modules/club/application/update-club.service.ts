import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClubRole } from '@prisma/client';
import type { ClubDetail } from '@smash-bill/shared';
import { CLUB_REPOSITORY, type ClubRepository, toClubSummaryDto } from '../club.repository';
import { SlugService } from '../domain/slug.service';
import type { UpdateClubDto } from '../dto/update-club.dto';

@Injectable()
export class UpdateClubService {
  constructor(
    @Inject(CLUB_REPOSITORY) private readonly clubRepository: ClubRepository,
    private readonly slugService: SlugService,
  ) {}

  async execute(clubId: string, dto: UpdateClubDto): Promise<ClubDetail> {
    const existing = await this.clubRepository.findClubById(clubId);
    if (!existing) {
      throw new NotFoundException({
        code: 'CLUB_NOT_FOUND',
        message: 'Club not found',
      });
    }

    let nextSlug: string | undefined;
    if (dto.name !== undefined && dto.name.trim() !== existing.name) {
      nextSlug = await this.slugService.generateUniqueSlug(dto.name.trim(), clubId);
    }

    const updated = await this.clubRepository.updateClub(clubId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description.trim() ? dto.description.trim() : null }
        : {}),
      ...(dto.location !== undefined
        ? { location: dto.location.trim() ? dto.location.trim() : null }
        : {}),
      ...(dto.defaultCourtFee !== undefined ? { defaultCourtFee: dto.defaultCourtFee } : {}),
    });

    return toClubSummaryDto(updated, ClubRole.ADMIN);
  }
}
