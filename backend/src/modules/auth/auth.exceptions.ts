import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * OTP request rate limit exceeded (Req 1.4). 429 with the remaining wait time;
 * the controller also sets a Retry-After header.
 */
export class OtpRateLimitException extends HttpException {
  constructor(public readonly retryAfterSec: number) {
    super(
      `Too many OTP requests. Try again in ${retryAfterSec} seconds.`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * Phone temporarily locked after too many failed verifications (Req 1.7). 429
 * with the lockout duration.
 */
export class OtpLockedException extends HttpException {
  constructor(public readonly retryAfterSec: number) {
    super(
      `Too many failed attempts. Locked for ${Math.ceil(retryAfterSec / 60)} minutes.`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/** MSG91 unavailable (Req 1.5). 503 with a 30-second Retry-After. */
export class ServiceUnavailableMsg91Exception extends HttpException {
  readonly retryAfterSec = 30;
  constructor() {
    super('OTP service is temporarily unavailable', HttpStatus.SERVICE_UNAVAILABLE);
  }
}
