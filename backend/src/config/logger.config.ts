import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

/**
 * Winston logger options (Req 15.5/15.7). Logs are JSON with timestamps so the
 * request-id attached by the exception filter is captured per entry.
 */
export const loggerOptions: WinstonModuleOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
};
