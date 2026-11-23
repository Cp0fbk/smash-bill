import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ClubRole, Sport } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import type { TokenGenerator } from '../../../common/tokens/token-generator';
import type {
  ClubMemberRecord,
  ClubMemberRepository,
  CreateClubMemberRecordInput,
  FindClubMembersFilter,
  UpdateClubMemberRecordInput,
} from '../club-member.repository';
import type { ClubRecord, ClubRepository } from '../club.repository';
import { AddMemberService } from './add-member.service';
import { DeactivateMemberService } from './deactivate-member.service';
import { JoinByInviteService } from './join-by-invite.service';
import { ListMembersService } from './list-members.service';
import { UpdateMemberService } from './update-member.service';

class InMemoryClubMemberRepository implements ClubMemberRepository {
  public members: ClubMemberRecord[] = [];
  private seq = 1;

  async findMembersByClub(
    clubId: string,
    filter?: FindClubMembersFilter,
  ): Promise<ClubMemberRecord[]> {
    return this.members.filter((m) => {
      if (m.clubId !== clubId) return false;
      if (filter?.role && m.role !== filter.role) return false;
      if (filter?.active !== undefined && m.isActive !== filter.active) return false;
      return true;
    });
  }

  async findMemberById(clubId: string, memberId: string): Promise<ClubMemberRecord | null> {
    return this.members.find((m) => m.clubId === clubId && m.id === memberId) ?? null;
  }

  async findMemberByPhone(
    clubId: string,
    normalizedPhone: string,
  ): Promise<ClubMemberRecord | null> {
    return this.members.find((m) => m.clubId === clubId && m.phone === normalizedPhone) ?? null;
  }

  async countActiveHosts(clubId: string): Promise<number> {
    return this.members.filter((m) => m.clubId === clubId && m.role === ClubRole.HOST && m.isActive)
      .length;
  }

  async createMember(input: CreateClubMemberRecordInput): Promise<ClubMemberRecord> {
    const now = new Date('2026-11-22T08:00:00.000Z');
    const created: ClubMemberRecord = {
      id: `mem-${this.seq++}`,
      clubId: input.clubId,
      userId: input.userId ?? null,
      displayName: input.displayName,
      phone: input.phone,
      role: input.role,
      publicToken: input.publicToken,
      isActive: true,
      joinedAt: now,
      updatedAt: now,
    };
    this.members.push(created);
    return created;
  }

  async updateMember(
    clubId: string,
    memberId: string,
    data: UpdateClubMemberRecordInput,
  ): Promise<ClubMemberRecord> {
    const found = this.members.find((m) => m.clubId === clubId && m.id === memberId);
    if (!found) {
      throw new Error('Member not found');
    }
    if (data.displayName !== undefined) found.displayName = data.displayName;
    if (data.phone !== undefined) found.phone = data.phone;
    if (data.role !== undefined) found.role = data.role;
    if (data.isActive !== undefined) found.isActive = data.isActive;
    found.updatedAt = new Date('2026-11-22T09:00:00.000Z');
    return found;
  }
}

describe('S04 Club Roster & Invite Self-Join Unit Tests', () => {
  let repo: InMemoryClubMemberRepository;
  let tokenCounter: number;
  let tokenGenerator: TokenGenerator;
  let listService: ListMembersService;
  let addService: AddMemberService;
  let updateService: UpdateMemberService;
  let deactivateService: DeactivateMemberService;
  let joinService: JoinByInviteService;

  const mockClub: ClubRecord = {
    id: 'club-1',
    name: 'CLB Sao Mai',
    slug: 'clb-sao-mai',
    description: 'Sân 3-5-7',
    location: 'Phú Nhuận',
    sport: Sport.BADMINTON,
    inviteCode: 'SAOMAI26',
    publicToken: 'club_pub_token_123456',
    bankBin: '970436',
    bankAccountNo: '0071001234567',
    bankAccountName: 'NGUYEN MINH QUAN',
    defaultCourtFee: 240000,
    ownerId: 'user-host-1',
    memberCount: 1,
    createdAt: new Date('2026-11-22T07:00:00.000Z'),
    updatedAt: new Date('2026-11-22T07:00:00.000Z'),
  };

  beforeEach(async () => {
    repo = new InMemoryClubMemberRepository();
    tokenCounter = 1;
    tokenGenerator = {
      generate: (len = 21) => `tok_${String(tokenCounter++).padStart(len - 4, '0')}`,
    };

    const clubRepositoryStub = {
      findClubByInviteCode: async (code: string) =>
        code === mockClub.inviteCode ? mockClub : null,
    } as unknown as ClubRepository;

    listService = new ListMembersService(repo);
    addService = new AddMemberService(repo, tokenGenerator);
    updateService = new UpdateMemberService(repo);
    deactivateService = new DeactivateMemberService(repo);
    joinService = new JoinByInviteService(clubRepositoryStub, repo, tokenGenerator);

    // Seed initial HOST
    await repo.createMember({
      clubId: 'club-1',
      userId: 'user-host-1',
      displayName: 'Nguyễn Minh Quân',
      phone: '0901112222',
      role: ClubRole.HOST,
      publicToken: 'host_pub_token_000001',
    });
  });

  it('normalizes phone numbers and detects duplicate phone numbers idempotently on AddMember', async () => {
    const added1 = await addService.execute('club-1', {
      displayName: 'Trần Hoàng Nam',
      phone: '0912 345 678',
      role: ClubRole.MEMBER,
    });

    expect(added1.phone).toBe('0912345678');
    expect(added1.role).toBe(ClubRole.MEMBER);

    // Adding again with +84 format returns the same member without creating a duplicate
    const added2 = await addService.execute('club-1', {
      displayName: 'Hoàng Nam Duplicate',
      phone: '+84 912-345-678',
    });

    expect(added2.id).toBe(added1.id);
    expect(repo.members).toHaveLength(2); // 1 HOST + 1 MEMBER
  });

  it('reactivates a deactivated member instead of duplicating when re-joining by invite or added by host', async () => {
    const joined1 = await joinService.join('SAOMAI26', {
      displayName: 'Lê Thu Hà',
      phone: '0987 654 321',
      type: 'REGULAR',
    });

    expect(joined1.isExisting).toBe(false);
    expect(joined1.reactivated).toBe(false);
    expect(joined1.member.role).toBe(ClubRole.MEMBER);

    // Host deactivates the member
    const deactivated = await deactivateService.execute('club-1', joined1.member.id);
    expect(deactivated.isActive).toBe(false);

    // Member re-joins via invite QR with +84 phone -> reactivated with same id & publicToken
    const joined2 = await joinService.join('saomai26', {
      displayName: 'Lê Thu Hà (Quay lại)',
      phone: '+84987654321',
      type: 'REGULAR',
    });

    expect(joined2.isExisting).toBe(true);
    expect(joined2.reactivated).toBe(true);
    expect(joined2.member.id).toBe(joined1.member.id);
    expect(joined2.member.publicToken).toBe(joined1.member.publicToken);
    expect(joined2.member.isActive).toBe(true);
    expect(joined2.member.displayName).toBe('Lê Thu Hà (Quay lại)');
  });

  it('enforces the last-HOST rule when attempting to deactivate or demote the sole active HOST', async () => {
    const soleHost = repo.members[0];
    if (!soleHost) {
      throw new Error('Expected seeded sole HOST');
    }

    await expect(deactivateService.execute('club-1', soleHost.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    await expect(
      updateService.execute('club-1', soleHost.id, { role: ClubRole.MEMBER }),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Once a second HOST is added, the first HOST can be deactivated or demoted
    const secondHost = await addService.execute('club-1', {
      displayName: 'Co-Host Bảo Long',
      phone: '0933444555',
      role: ClubRole.HOST,
    });
    expect(secondHost.role).toBe(ClubRole.HOST);

    const demoted = await updateService.execute('club-1', soleHost.id, {
      role: ClubRole.MEMBER,
    });
    expect(demoted.role).toBe(ClubRole.MEMBER);

    // Now secondHost is the last HOST and cannot be deactivated
    await expect(deactivateService.execute('club-1', secondHost.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('searches Vietnamese names with or without diacritics (minh finds Minh, Mình)', async () => {
    await addService.execute('club-1', {
      displayName: 'Phạm Văn Mình',
      phone: '0977888999',
    });
    await addService.execute('club-1', {
      displayName: 'Lê Thu Hà',
      phone: '0966555444',
    });

    const matches = await listService.execute('club-1', { q: 'minh' });
    expect(matches.map((m) => m.displayName)).toEqual(['Nguyễn Minh Quân', 'Phạm Văn Mình']);
  });

  it('rejects duplicate phone numbers on UpdateMember and invalid invite codes on JoinByInvite', async () => {
    const memberA = await addService.execute('club-1', {
      displayName: 'Player A',
      phone: '0911222333',
    });
    const memberB = await addService.execute('club-1', {
      displayName: 'Player B',
      phone: '0944555666',
    });

    await expect(
      updateService.execute('club-1', memberB.id, { phone: '+84 911 222 333' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(memberA.phone).toBe('0911222333');

    await expect(joinService.getInviteInfo('INVALID99')).rejects.toBeInstanceOf(NotFoundException);
  });
});
