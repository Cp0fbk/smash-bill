import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { ClubMembershipRecord } from '../club.repository';

export const CurrentMembership = createParamDecorator(
  (data: keyof ClubMembershipRecord | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { clubMembership?: ClubMembershipRecord }>();
    const membership = request.clubMembership;
    if (!membership) {
      return undefined;
    }
    return data ? membership[data] : membership;
  },
);
