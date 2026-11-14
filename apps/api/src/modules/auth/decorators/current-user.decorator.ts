import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { AccountStatus, AuthProvider } from '@prisma/client';
import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  provider: AuthProvider;
  status: AccountStatus;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) {
      return undefined;
    }
    return data ? user[data] : user;
  },
);
