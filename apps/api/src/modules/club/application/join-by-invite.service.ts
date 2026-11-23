import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClubRole } from '@prisma/client';
import {
  type JoinByInviteResult,
  type PublicInviteClubInfo,
  isValidVietnamPhone,
  normalizePhone,
} from '@smash-bill/shared';
import { TOKEN_GENERATOR } from '../../../common/constants/injection-tokens';
import type { TokenGenerator } from '../../../common/tokens/token-generator';
import {
  CLUB_MEMBER_REPOSITORY,
  type ClubMemberRepository,
  toPublicInviteClubInfo,
} from '../club-member.repository';
import { CLUB_REPOSITORY, type ClubRepository } from '../club.repository';
import type { JoinByInviteDto } from '../dto/join-by-invite.dto';

@Injectable()
export class JoinByInviteService {
  constructor(
    @Inject(CLUB_REPOSITORY)
    private readonly clubRepository: ClubRepository,
    @Inject(CLUB_MEMBER_REPOSITORY)
    private readonly memberRepository: ClubMemberRepository,
    @Inject(TOKEN_GENERATOR)
    private readonly tokenGenerator: TokenGenerator,
  ) {}

  async getInviteInfo(inviteCode: string): Promise<PublicInviteClubInfo> {
    const normalizedCode = inviteCode.trim().toUpperCase();
    const club = await this.clubRepository.findClubByInviteCode(normalizedCode);

    if (!club) {
      throw new NotFoundException({
        code: 'INVITE_NOT_FOUND',
        message: 'Invite code is invalid or has been rotated',
      });
    }

    return toPublicInviteClubInfo(club);
  }

  async join(inviteCode: string, dto: JoinByInviteDto): Promise<JoinByInviteResult> {
    const normalizedCode = inviteCode.trim().toUpperCase();
    const club = await this.clubRepository.findClubByInviteCode(normalizedCode);

    if (!club) {
      throw new NotFoundException({
        code: 'INVITE_NOT_FOUND',
        message: 'Invite code is invalid or has been rotated',
      });
    }

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

    const targetRole = dto.type === 'GUEST' ? ClubRole.GUEST : ClubRole.MEMBER;

    if (normalizedPhone) {
      const existing = await this.memberRepository.findMemberByPhone(club.id, normalizedPhone);
      if (existing) {
        if (!existing.isActive) {
          const reactivatedRole = existing.role === ClubRole.HOST ? ClubRole.HOST : targetRole;
          const reactivated = await this.memberRepository.updateMember(club.id, existing.id, {
            isActive: true,
            displayName,
            phone: normalizedPhone,
            role: reactivatedRole,
          });
          return {
            club: toPublicInviteClubInfo({
              ...club,
              memberCount: club.memberCount + 1,
            }),
            member: {
              id: reactivated.id,
              displayName: reactivated.displayName,
              phone: reactivated.phone,
              role: reactivated.role,
              publicToken: reactivated.publicToken,
              isActive: reactivated.isActive,
            },
            isExisting: true,
            reactivated: true,
          };
        }

        return {
          club: toPublicInviteClubInfo(club),
          member: {
            id: existing.id,
            displayName: existing.displayName,
            phone: existing.phone,
            role: existing.role,
            publicToken: existing.publicToken,
            isActive: existing.isActive,
          },
          isExisting: true,
          reactivated: false,
        };
      }
    }

    const created = await this.memberRepository.createMember({
      clubId: club.id,
      displayName,
      phone: normalizedPhone,
      role: targetRole,
      publicToken: this.tokenGenerator.generate(),
    });

    return {
      club: toPublicInviteClubInfo({
        ...club,
        memberCount: club.memberCount + 1,
      }),
      member: {
        id: created.id,
        displayName: created.displayName,
        phone: created.phone,
        role: created.role,
        publicToken: created.publicToken,
        isActive: created.isActive,
      },
      isExisting: false,
      reactivated: false,
    };
  }
}
