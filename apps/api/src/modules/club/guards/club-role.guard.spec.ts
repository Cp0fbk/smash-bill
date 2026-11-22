import {
  type ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountStatus, AuthProvider, ClubRole, UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { ClubMembershipRecord, ClubRepository } from '../club.repository';
import { ClubRoleGuard } from './club-role.guard';

function createMockContext(params: {
  user?: AuthenticatedUser;
  clubId?: string;
}): {
  context: ExecutionContext;
  request: {
    user?: AuthenticatedUser;
    params: { clubId?: string };
    clubMembership?: ClubMembershipRecord;
  };
} {
  const request: {
    user?: AuthenticatedUser;
    params: { clubId?: string };
    clubMembership?: ClubMembershipRecord;
  } = {
    user: params.user,
    params: { clubId: params.clubId },
  };

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;

  return { context, request };
}

describe('ClubRoleGuard & RolesGuard', () => {
  const sampleUser: AuthenticatedUser = {
    id: 'usr_1',
    provider: AuthProvider.GOOGLE,
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
  };

  let memberships: Map<string, ClubMembershipRecord>;
  let requiredClubRoles: ClubRole[] | undefined;
  let requiredUserRoles: UserRole[] | undefined;
  let clubRoleGuard: ClubRoleGuard;
  let rolesGuard: RolesGuard;

  beforeEach(() => {
    memberships = new Map<string, ClubMembershipRecord>();
    requiredClubRoles = undefined;
    requiredUserRoles = undefined;

    const clubReflector = {
      getAllAndOverride: () => requiredClubRoles,
    } as unknown as Reflector;

    const userReflector = {
      getAllAndOverride: () => requiredUserRoles,
    } as unknown as Reflector;

    const fakeRepo = {
      findMembership: async (clubId: string, userId: string) =>
        memberships.get(`${clubId}:${userId}`) ?? null,
    } as unknown as ClubRepository;

    clubRoleGuard = new ClubRoleGuard(clubReflector, fakeRepo);
    rolesGuard = new RolesGuard(userReflector);
  });

  it('throws 401 when user is missing on request', async () => {
    const { context } = createMockContext({ clubId: 'club_1' });
    await expect(clubRoleGuard.canActivate(context)).rejects.toThrowError(UnauthorizedException);
  });

  it('throws 404 CLUB_NOT_FOUND when user is not a member of the club (does not leak existence)', async () => {
    const { context } = createMockContext({ user: sampleUser, clubId: 'club_secret' });
    await expect(clubRoleGuard.canActivate(context)).rejects.toThrowError(NotFoundException);
  });

  it('attaches request.clubMembership and allows any member when no @ClubRoles() is specified', async () => {
    const membership: ClubMembershipRecord = {
      id: 'cm_1',
      clubId: 'club_1',
      userId: sampleUser.id,
      displayName: 'Minh',
      phone: null,
      role: ClubRole.MEMBER,
      publicToken: 'tok_mem_1',
      isActive: true,
    };
    memberships.set('club_1:usr_1', membership);

    const { context, request } = createMockContext({ user: sampleUser, clubId: 'club_1' });
    const allowed = await clubRoleGuard.canActivate(context);

    expect(allowed).toBe(true);
    expect(request.clubMembership).toEqual(membership);
  });

  it('throws 403 INSUFFICIENT_CLUB_ROLE when a MEMBER accesses a @ClubRoles(ClubRole.ADMIN) endpoint', async () => {
    memberships.set('club_1:usr_1', {
      id: 'cm_1',
      clubId: 'club_1',
      userId: sampleUser.id,
      displayName: 'Member User',
      phone: null,
      role: ClubRole.MEMBER,
      publicToken: 'tok_mem_1',
      isActive: true,
    });
    requiredClubRoles = [ClubRole.ADMIN];

    const { context } = createMockContext({ user: sampleUser, clubId: 'club_1' });
    await expect(clubRoleGuard.canActivate(context)).rejects.toThrowError(ForbiddenException);
  });

  it('allows Club ADMIN on @ClubRoles(ClubRole.ADMIN) endpoint', async () => {
    memberships.set('club_1:usr_1', {
      id: 'cm_1',
      clubId: 'club_1',
      userId: sampleUser.id,
      displayName: 'Admin User',
      phone: null,
      role: ClubRole.ADMIN,
      publicToken: 'tok_adm_1',
      isActive: true,
    });
    requiredClubRoles = [ClubRole.ADMIN];

    const { context } = createMockContext({ user: sampleUser, clubId: 'club_1' });
    expect(await clubRoleGuard.canActivate(context)).toBe(true);
  });

  it('RolesGuard enforces global UserRole.ADMIN and rejects UserRole.USER with 403', () => {
    requiredUserRoles = [UserRole.ADMIN];

    const { context: userCtx } = createMockContext({ user: sampleUser });
    expect(() => rolesGuard.canActivate(userCtx)).toThrowError(ForbiddenException);

    const { context: adminCtx } = createMockContext({
      user: { ...sampleUser, role: UserRole.ADMIN },
    });
    expect(rolesGuard.canActivate(adminCtx)).toBe(true);
  });
});
