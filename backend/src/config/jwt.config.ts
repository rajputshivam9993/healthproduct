import { registerAs } from '@nestjs/config';

/** JWT secrets and lifetimes (access: 15m, refresh: 7d per Req 3). */
export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
  accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
  refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
}));
