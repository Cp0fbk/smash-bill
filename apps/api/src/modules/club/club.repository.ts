import type { ClubRole, Sport } from '@prisma/client';
import { type ClubSummary, findBankByBin } from '@smash-bill/shared';

export const CLUB_REPOSITORY = Symbol('CLUB_REPOSITORY');

export interface ClubRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  sport: Sport;
  inviteCode: string;
  publicToken: string;
  bankBin: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  defaultCourtFee: number;
  ownerId: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClubMembershipRecord {
  id: string;
  clubId: string;
  userId: string | null;
  displayName: string;
  phone: string | null;
  role: ClubRole;
  publicToken: string;
  isActive: boolean;
}

export interface ClubWithMyRole {
  club: ClubRecord;
  myRole: ClubRole;
}

export interface CreateClubRecordInput {
  ownerId: string;
  ownerDisplayName: string;
  ownerPhone: string | null;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  defaultCourtFee: number;
  inviteCode: string;
  publicToken: string;
  adminMemberPublicToken: string;
}

export interface UpdateClubRecordInput {
  name?: string;
  slug?: string;
  description?: string | null;
  location?: string | null;
  defaultCourtFee?: number;
}

export interface UpdateBankAccountRecordInput {
  bankBin: string;
  bankAccountNo: string;
  bankAccountName: string;
}

export interface ClubRepository {
  existsBySlug(slug: string, excludeClubId?: string): Promise<boolean>;
  existsByInviteCode(inviteCode: string): Promise<boolean>;
  createClubWithAdmin(input: CreateClubRecordInput): Promise<ClubWithMyRole>;
  findClubsByUserId(userId: string): Promise<ClubWithMyRole[]>;
  findClubById(clubId: string): Promise<ClubRecord | null>;
  findClubByInviteCode(inviteCode: string): Promise<ClubRecord | null>;
  findMembership(clubId: string, userId: string): Promise<ClubMembershipRecord | null>;
  updateClub(clubId: string, data: UpdateClubRecordInput): Promise<ClubRecord>;
  updateBankAccount(clubId: string, data: UpdateBankAccountRecordInput): Promise<ClubRecord>;
  rotateTokens(
    clubId: string,
    data: { inviteCode?: string; publicToken?: string },
  ): Promise<ClubRecord>;
}

export function toClubSummaryDto(club: ClubRecord, myRole: ClubRole): ClubSummary {
  const bank = club.bankBin ? findBankByBin(club.bankBin) : undefined;
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
    bankShortName: bank?.shortName ?? null,
    bankAccountNo: club.bankAccountNo,
    bankAccountName: club.bankAccountName,
    defaultCourtFee: club.defaultCourtFee,
    ownerId: club.ownerId,
    myRole,
    memberCount: club.memberCount,
    createdAt: club.createdAt.toISOString(),
    updatedAt: club.updatedAt.toISOString(),
  };
}
