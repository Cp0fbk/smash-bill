import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountStatus, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenService } from '../token.service';
import { isConfiguredPlatformAdminEmail } from '../utils/admin-email';
import { ACCESS_COOKIE_NAME, getCookie } from '../utils/cookies';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const payload = this.tokenService.verifyAccessToken(token);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        provider: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authenticated user no longer exists',
      });
    }

    if (user.status === AccountStatus.BANNED) {
      throw new ForbiddenException({
        code: 'ACCOUNT_BANNED',
        message: 'Account has been permanently banned',
      });
    }

    let effectiveRole = user.role;
    if (effectiveRole !== UserRole.ADMIN && isConfiguredPlatformAdminEmail(user.email)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.ADMIN },
      });
      effectiveRole = UserRole.ADMIN;
    }

    request.user = {
      id: user.id,
      provider: user.provider,
      role: effectiveRole,
      status: user.status,
    };

    return true;
  }

  private extractToken(req: Request): string | undefined {
    const cookieToken = getCookie(req, ACCESS_COOKIE_NAME);
    if (cookieToken) {
      return cookieToken;
    }

    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length).trim();
    }

    return undefined;
  }
}
