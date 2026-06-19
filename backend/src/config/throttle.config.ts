import { registerAs } from '@nestjs/config';

/** Rate-limit window/threshold — defaults to 100 requests / 60s per IP (Req 15.4). */
export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
}));
