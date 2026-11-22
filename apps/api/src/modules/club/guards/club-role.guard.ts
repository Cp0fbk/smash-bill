import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ClubRole } from '@prisma/client';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import {
  CLUB_REPOSITORY,
  type ClubMembershipRecord,
  type ClubRepository,
} from '../club.repository';
import { CLUB_ROLES_KEY } from '../decorators/club-roles.decorator';

@Injectable()
export class ClubRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(CLUB_REPOSITORY) private readonly clubRepository: ClubRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & {
        user?: AuthenticatedUser;
        clubMembership?: ClubMembershipRecord;
      }
    >();

    const user = request.user;
    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const clubId = request.params?.clubId;
    if (!clubId || typeof clubId !== 'string') {
      throw new NotFoundException({
        code: 'CLUB_NOT_FOUND',
        message: 'Club not found',
      });
    }

    const membership = await this.clubRepository.findMembership(clubId, user.id);
    if (!membership) {
      // Do not leak whether the club exists to non-members
      throw new NotFoundException({
        code: 'CLUB_NOT_FOUND',
        message: 'Club not found',
      });
    }

    request.clubMembership = membership;

    const requiredClubRoles = this.reflector.getAllAndOverride<ClubRole[]>(CLUB_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredClubRoles && requiredClubRoles.length > 0) {
      if (!requiredClubRoles.includes(membership.role)) {
        throw new ForbiddenException({
          code: 'INSUFFICIENT_CLUB_ROLE',
          message: 'Club administrator privileges are required for this action',
        });
      }
    }

    return true;
  }
}
