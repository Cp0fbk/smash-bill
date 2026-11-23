import { Injectable } from '@nestjs/common';
import { type Club, ClubRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ClubMembershipRecord,
  ClubRecord,
  ClubRepository,
  ClubWithMyRole,
  CreateClubRecordInput,
  UpdateBankAccountRecordInput,
  UpdateClubRecordInput,
} from '../club.repository';

type ClubWithCount = Club & {
  _count?: {
    members: number;
  };
};

function mapClubRecord(club: ClubWithCount): ClubRecord {
  return {
    id: club.id,
    name: club.name,
    slug: club.slug,
    description: club.description,
    location: club.location,
    sport: club.sport,
    inviteCode: club.inviteCode,
    publicToken: club.publicToken,
    bankBin: club.bankBin,
    bankAccountNo: club.bankAccountNo,
    bankAccountName: club.bankAccountName,
    defaultCourtFee: club.defaultCourtFee,
    ownerId: club.ownerId,
    memberCount: club._count?.members ?? 1,
    createdAt: club.createdAt,
    updatedAt: club.updatedAt,
  };
}

@Injectable()
export class PrismaClubRepository implements ClubRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsBySlug(slug: string, excludeClubId?: string): Promise<boolean> {
    const found = await this.prisma.club.findFirst({
      where: {
        slug,
        ...(excludeClubId ? { id: { not: excludeClubId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(found);
  }

  async existsByInviteCode(inviteCode: string): Promise<boolean> {
    const found = await this.prisma.club.findUnique({
      where: { inviteCode },
      select: { id: true },
    });
    return Boolean(found);
  }

  async createClubWithAdmin(input: CreateClubRecordInput): Promise<ClubWithMyRole> {
    return this.prisma.$transaction(async (tx) => {
      const createdClub = await tx.club.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          location: input.location,
          defaultCourtFee: input.defaultCourtFee,
          inviteCode: input.inviteCode,
          publicToken: input.publicToken,
          ownerId: input.ownerId,
          members: {
            create: {
              userId: input.ownerId,
              displayName: input.ownerDisplayName,
              phone: input.ownerPhone,
              role: ClubRole.HOST,
              publicToken: input.adminMemberPublicToken,
              isActive: true,
            },
          },
        },
        include: {
          _count: {
            select: {
              members: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      return {
        club: mapClubRecord(createdClub),
        myRole: ClubRole.HOST,
      };
    });
  }

  async findClubsByUserId(userId: string): Promise<ClubWithMyRole[]> {
    const memberships = await this.prisma.clubMember.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        club: {
          include: {
            _count: {
              select: {
                members: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return memberships.map((membership) => ({
      club: mapClubRecord(membership.club),
      myRole: membership.role,
    }));
  }

  async findClubById(clubId: string): Promise<ClubRecord | null> {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      include: {
        _count: {
          select: {
            members: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return club ? mapClubRecord(club) : null;
  }

  async findClubByInviteCode(inviteCode: string): Promise<ClubRecord | null> {
    const club = await this.prisma.club.findUnique({
      where: { inviteCode },
      include: {
        _count: {
          select: {
            members: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return club ? mapClubRecord(club) : null;
  }

  async findMembership(clubId: string, userId: string): Promise<ClubMembershipRecord | null> {
    const membership = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (!membership || !membership.isActive) {
      return null;
    }

    return {
      id: membership.id,
      clubId: membership.clubId,
      userId: membership.userId,
      displayName: membership.displayName,
      phone: membership.phone,
      role: membership.role,
      publicToken: membership.publicToken,
      isActive: membership.isActive,
    };
  }

  async updateClub(clubId: string, data: UpdateClubRecordInput): Promise<ClubRecord> {
    const updated = await this.prisma.club.update({
      where: { id: clubId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.defaultCourtFee !== undefined ? { defaultCourtFee: data.defaultCourtFee } : {}),
      },
      include: {
        _count: {
          select: {
            members: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return mapClubRecord(updated);
  }

  async updateBankAccount(clubId: string, data: UpdateBankAccountRecordInput): Promise<ClubRecord> {
    const updated = await this.prisma.club.update({
      where: { id: clubId },
      data: {
        bankBin: data.bankBin,
        bankAccountNo: data.bankAccountNo,
        bankAccountName: data.bankAccountName,
      },
      include: {
        _count: {
          select: {
            members: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return mapClubRecord(updated);
  }

  async rotateTokens(
    clubId: string,
    data: { inviteCode?: string; publicToken?: string },
  ): Promise<ClubRecord> {
    const updated = await this.prisma.club.update({
      where: { id: clubId },
      data: {
        ...(data.inviteCode ? { inviteCode: data.inviteCode } : {}),
        ...(data.publicToken ? { publicToken: data.publicToken } : {}),
      },
      include: {
        _count: {
          select: {
            members: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return mapClubRecord(updated);
  }
}
