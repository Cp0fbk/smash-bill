import { Inject, Injectable } from '@nestjs/common';
import { ClubRole } from '@prisma/client';
import type { ClubDetail } from '@smash-bill/shared';
import { TOKEN_GENERATOR } from '../../../common/constants/injection-tokens';
import type { TokenGenerator } from '../../../common/tokens/token-generator';
import { CLUB_REPOSITORY, type ClubRepository, toClubSummaryDto } from '../club.repository';
import { SlugService } from '../domain/slug.service';
import type { RotateClubTokensDto } from '../dto/rotate-club-tokens.dto';

@Injectable()
export class RotateClubTokensService {
  constructor(
    @Inject(CLUB_REPOSITORY) private readonly clubRepository: ClubRepository,
    @Inject(TOKEN_GENERATOR) private readonly tokenGenerator: TokenGenerator,
    private readonly slugService: SlugService,
  ) {}

  async execute(clubId: string, dto?: RotateClubTokensDto): Promise<ClubDetail> {
    const shouldRotateInvite = dto?.rotateInviteCode ?? true;
    const shouldRotatePublic = dto?.rotatePublicToken ?? true;

    const inviteCode = shouldRotateInvite
      ? await this.slugService.generateUniqueInviteCode()
      : undefined;
    const publicToken = shouldRotatePublic ? this.tokenGenerator.generate() : undefined;

    const updated = await this.clubRepository.rotateTokens(clubId, {
      ...(inviteCode ? { inviteCode } : {}),
      ...(publicToken ? { publicToken } : {}),
    });

    return toClubSummaryDto(updated, ClubRole.ADMIN);
  }
}
