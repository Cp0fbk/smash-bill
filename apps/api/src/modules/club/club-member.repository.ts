import type { ClubRole } from '@prisma/client';
import type { ClubMemberDto, PublicInviteClubInfo } from '@smash-bill/shared';
import type { ClubRecord } from './club.repository';

export const CLUB_MEMBER_REPOSITORY = Symbol('CLUB_MEMBER_REPOSITORY');

export interface ClubMemberRecord {
  id: string;
  clubId: string;
  userId: string | null;
  displayName: string;
  phone: string | null;
  role: ClubRole;
  publicToken: string;
  isActive: boolean;
  joinedAt: Date;
  updatedAt: Date;
}

export interface CreateClubMemberRecordInput {
  clubId: string;
  userId?: string | null;
  displayName: string;
  phone: string | null;
  role: ClubRole;
  publicToken: string;
}

export interface UpdateClubMemberRecordInput {
  displayName?: string;
  phone?: string | null;
  role?: ClubRole;
  isActive?: boolean;
}

export interface FindClubMembersFilter {
  role?: ClubRole;
  active?: boolean;
}

export interface ClubMemberRepository {
  findMembersByClub(clubId: string, filter?: FindClubMembersFilter): Promise<ClubMemberRecord[]>;
  findMemberById(clubId: string, memberId: string): Promise<ClubMemberRecord | null>;
  findMemberByPhone(clubId: string, normalizedPhone: string): Promise<ClubMemberRecord | null>;
  countActiveHosts(clubId: string): Promise<number>;
  createMember(input: CreateClubMemberRecordInput): Promise<ClubMemberRecord>;
  updateMember(
    clubId: string,
    memberId: string,
    data: UpdateClubMemberRecordInput,
  ): Promise<ClubMemberRecord>;
}

export function toClubMemberDto(member: ClubMemberRecord): ClubMemberDto {
  return {
    id: member.id,
    clubId: member.clubId,
    userId: member.userId,
    displayName: member.displayName,
    phone: member.phone,
    role: member.role,
    publicToken: member.publicToken,
    isActive: member.isActive,
    joinedAt: member.joinedAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };
}

export function toPublicInviteClubInfo(club: ClubRecord): PublicInviteClubInfo {
  return {
    clubId: club.id,
    name: club.name,
    slug: club.slug,
    description: club.description,
    location: club.location,
    sport: club.sport,
    memberCount: club.memberCount,
  };
}
