import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClubRole } from '@prisma/client';
import { type ClubMemberDto, isValidVietnamPhone, normalizePhone } from '@smash-bill/shared';
import { TOKEN_GENERATOR } from '../../../common/constants/injection-tokens';
import type { TokenGenerator } from '../../../common/tokens/token-generator';
import {
  CLUB_MEMBER_REPOSITORY,
  type ClubMemberRepository,
  toClubMemberDto,
} from '../club-member.repository';
import type { AddMemberDto } from '../dto/add-member.dto';

@Injectable()
export class AddMemberService {
  constructor(
    @Inject(CLUB_MEMBER_REPOSITORY)
    private readonly memberRepository: ClubMemberRepository,
    @Inject(TOKEN_GENERATOR)
    private readonly tokenGenerator: TokenGenerator,
  ) {}

  async execute(clubId: string, dto: AddMemberDto): Promise<ClubMemberDto> {
    const displayName = dto.displayName.trim();
    if (!displayName) {
      throw new BadRequestException({
        code: 'INVALID_DISPLAY_NAME',
        message: 'Display name must not be empty',
      });
    }

    const normalizedPhone = normalizePhone(dto.phone);
    if (normalizedPhone !== null && !isValidVietnamPhone(normalizedPhone)) {
      throw new BadRequestException({
        code: 'INVALID_PHONE',
        message: 'Invalid Vietnamese phone number format',
      });
    }

    const role = dto.role ?? ClubRole.MEMBER;

    // Duplicate detection: same club + same normalized phone -> return existing (or reactivate)
    if (normalizedPhone) {
      const existing = await this.memberRepository.findMemberByPhone(clubId, normalizedPhone);
      if (existing) {
        if (!existing.isActive) {
          const reactivated = await this.memberRepository.updateMember(clubId, existing.id, {
            isActive: true,
            displayName,
            role: dto.role ?? existing.role,
            phone: normalizedPhone,
          });
          return toClubMemberDto(reactivated);
        }
        return toClubMemberDto(existing);
      }
    }

    const created = await this.memberRepository.createMember({
      clubId,
      displayName,
      phone: normalizedPhone,
      role,
      publicToken: this.tokenGenerator.generate(),
    });

    return toClubMemberDto(created);
  }
}
