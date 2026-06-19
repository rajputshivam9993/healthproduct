import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../entities/enums';
import { AuthUser } from '../decorators/current-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * The RBAC_Guard (Req 3.6). Reads roles declared via @Roles() and rejects the
 * request when the authenticated user's role is not permitted. Assumes
 * JwtAuthGuard has already populated `request.user`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role for this resource');
    }
    return true;
  }
}
