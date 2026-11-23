import { Injectable } from '@nestjs/common';
import { type ClubMember, ClubRole } from '@prisma/client';
import { normalizePhone } from '@smash-bill/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ClubMemberRecord,
  ClubMemberRepository,
  CreateClubMemberRecordInput,
  FindClubMembersFilter,
  UpdateClubMemberRecordInput,
} from '../club-member.repository';

function mapClubMemberRecord(member: ClubMember): ClubMemberRecord {
  return {
    id: member.id,
    clubId: member.clubId,
    userId: member.userId,
    displayName: member.displayName,
    phone: member.phone,
    role: member.role,
    publicToken: member.publicToken,
    isActive: member.isActive,
    joinedAt: member.joinedAt,
    updatedAt: member.updatedAt,
  };
}

@Injectable()
export class PrismaClubMemberRepository implements ClubMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMembersByClub(
    clubId: string,
    filter?: FindClubMembersFilter,
  ): Promise<ClubMemberRecord[]> {
    const rows = await this.prisma.clubMember.findMany({
      where: {
        clubId,
        ...(filter?.role ? { role: filter.role } : {}),
        ...(filter?.active !== undefined ? { isActive: filter.active } : {}),
      },
      orderBy: [{ isActive: 'desc' }, { joinedAt: 'asc' }],
    });

    return rows.map(mapClubMemberRecord);
  }

  async findMemberById(clubId: string, memberId: string): Promise<ClubMemberRecord | null> {
    const member = await this.prisma.clubMember.findFirst({
      where: {
        id: memberId,
        clubId,
      },
    });

    return member ? mapClubMemberRecord(member) : null;
  }

  async findMemberByPhone(
    clubId: string,
    normalizedPhone: string,
  ): Promise<ClubMemberRecord | null> {
    const exact = await this.prisma.clubMember.findFirst({
      where: {
        clubId,
        phone: normalizedPhone,
      },
    });
    if (exact) {
      return mapClubMemberRecord(exact);
    }

    // Fallback check in case legacy seeded rows stored unnormalized phone format
    const clubMembersWithPhone = await this.prisma.clubMember.findMany({
      where: {
        clubId,
        phone: { not: null },
      },
    });

    const matched = clubMembersWithPhone.find((m) => normalizePhone(m.phone) === normalizedPhone);
    return matched ? mapClubMemberRecord(matched) : null;
  }

  async countActiveHosts(clubId: string): Promise<number> {
    return this.prisma.clubMember.count({
      where: {
        clubId,
        role: ClubRole.HOST,
        isActive: true,
      },
    });
  }

  async createMember(input: CreateClubMemberRecordInput): Promise<ClubMemberRecord> {
    const created = await this.prisma.clubMember.create({
      data: {
        clubId: input.clubId,
        userId: input.userId ?? null,
        displayName: input.displayName,
        phone: input.phone,
        role: input.role,
        publicToken: input.publicToken,
        isActive: true,
      },
    });

    return mapClubMemberRecord(created);
  }

  async updateMember(
    clubId: string,
    memberId: string,
    data: UpdateClubMemberRecordInput,
  ): Promise<ClubMemberRecord> {
    const updated = await this.prisma.clubMember.update({
      where: {
        id: memberId,
        clubId,
      },
      data: {
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    return mapClubMemberRecord(updated);
  }
}
