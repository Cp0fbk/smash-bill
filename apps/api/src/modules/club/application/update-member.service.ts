import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClubRole } from '@prisma/client';
import { type ClubMemberDto, isValidVietnamPhone, normalizePhone } from '@smash-bill/shared';
import {
  CLUB_MEMBER_REPOSITORY,
  type ClubMemberRepository,
  toClubMemberDto,
} from '../club-member.repository';
import type { UpdateMemberDto } from '../dto/update-member.dto';

@Injectable()
export class UpdateMemberService {
  constructor(
    @Inject(CLUB_MEMBER_REPOSITORY)
    private readonly memberRepository: ClubMemberRepository,
  ) {}

  async execute(clubId: string, memberId: string, dto: UpdateMemberDto): Promise<ClubMemberDto> {
    const existing = await this.memberRepository.findMemberById(clubId, memberId);
    if (!existing) {
      throw new NotFoundException({
        code: 'MEMBER_NOT_FOUND',
        message: 'Club member not found',
      });
    }

    // Last-HOST invariant: cannot demote or deactivate the last active HOST
    const willDemoteHost = dto.role !== undefined && dto.role !== ClubRole.HOST;
    const willDeactivateHost = dto.isActive === false;

    if (
      existing.role === ClubRole.HOST &&
      existing.isActive &&
      (willDemoteHost || willDeactivateHost)
    ) {
      const activeHosts = await this.memberRepository.countActiveHosts(clubId);
      if (activeHosts <= 1) {
        throw new BadRequestException({
          code: 'LAST_HOST_REQUIRED',
          message: 'Cannot demote or deactivate the last active HOST of the club',
        });
      }
    }

    let normalizedPhone: string | null | undefined;
    if (dto.phone !== undefined) {
      normalizedPhone = normalizePhone(dto.phone);
      if (normalizedPhone !== null && !isValidVietnamPhone(normalizedPhone)) {
        throw new BadRequestException({
          code: 'INVALID_PHONE',
          message: 'Invalid Vietnamese phone number format',
        });
      }

      if (normalizedPhone !== null) {
        const duplicate = await this.memberRepository.findMemberByPhone(clubId, normalizedPhone);
        if (duplicate && duplicate.id !== memberId) {
          throw new ConflictException({
            code: 'DUPLICATE_MEMBER_PHONE',
            message: 'Another member in this club already uses this phone number',
          });
        }
      }
    }

    const displayName = dto.displayName !== undefined ? dto.displayName.trim() : undefined;
    if (displayName !== undefined && !displayName) {
      throw new BadRequestException({
        code: 'INVALID_DISPLAY_NAME',
        message: 'Display name must not be empty',
      });
    }

    const updated = await this.memberRepository.updateMember(clubId, memberId, {
      ...(displayName !== undefined ? { displayName } : {}),
      ...(normalizedPhone !== undefined ? { phone: normalizedPhone } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });

    return toClubMemberDto(updated);
  }
}
