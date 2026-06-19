import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../entities/enums';

/** Shape of the authenticated principal attached to the request by JwtAuthGuard. */
export interface AuthUser {
  id: string;
  role: UserRole;
}

/**
 * Injects the authenticated user (or a single property of it) into a handler:
 * `@CurrentUser() user: AuthUser` or `@CurrentUser('id') userId: string`.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | string => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return data ? request.user?.[data] : request.user;
  },
);
