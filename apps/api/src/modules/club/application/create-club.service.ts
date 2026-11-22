import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ClubSummary } from '@smash-bill/shared';
import { TOKEN_GENERATOR } from '../../../common/constants/injection-tokens';
import type { TokenGenerator } from '../../../common/tokens/token-generator';
import { PrismaService } from '../../../prisma/prisma.service';
import { CLUB_REPOSITORY, type ClubRepository, toClubSummaryDto } from '../club.repository';
import { SlugService } from '../domain/slug.service';
import type { CreateClubDto } from '../dto/create-club.dto';

@Injectable()
export class CreateClubService {
  constructor(
    @Inject(CLUB_REPOSITORY) private readonly clubRepository: ClubRepository,
    @Inject(TOKEN_GENERATOR) private readonly tokenGenerator: TokenGenerator,
    private readonly slugService: SlugService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, dto: CreateClubDto): Promise<ClubSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, phone: true },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'Authenticated user not found',
      });
    }

    const slug = await this.slugService.generateUniqueSlug(dto.name);
    const inviteCode = await this.slugService.generateUniqueInviteCode();
    const publicToken = this.tokenGenerator.generate();
    const adminMemberPublicToken = this.tokenGenerator.generate();

    const created = await this.clubRepository.createClubWithAdmin({
      ownerId: user.id,
      ownerDisplayName: user.name,
      ownerPhone: user.phone,
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim() ? dto.description.trim() : null,
      location: dto.location?.trim() ? dto.location.trim() : null,
      defaultCourtFee: dto.defaultCourtFee ?? 0,
      inviteCode,
      publicToken,
      adminMemberPublicToken,
    });

    return toClubSummaryDto(created.club, created.myRole);
  }
}
