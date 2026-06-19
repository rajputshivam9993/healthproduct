import { registerAs } from '@nestjs/config';

/** Redis connection settings — used for the refresh-token store and caching. */
export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
}));
