import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../entities/enums';

export const ROLES_KEY = 'roles';

/**
 * Restricts a controller or handler to the given roles. Enforced by RolesGuard
 * (the RBAC_Guard, Req 3.6). Usage: `@Roles(UserRole.ADMIN)`.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
