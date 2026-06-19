import { Injectable } from '@nestjs/common';

// OTP policy constants (Req 1). Centralized so they're easy to tune (Req 20.8).
const OTP_TTL_MS = 5 * 60 * 1000; // OTP valid for 5 minutes (Req 1.2)
const REQUEST_WINDOW_MS = 5 * 60 * 1000; // sliding window for request rate limit
const MAX_REQUESTS_PER_WINDOW = 3; // Req 1.4
const MAX_FAILED_VERIFICATIONS = 5; // Req 1.7
const LOCKOUT_MS = 15 * 60 * 1000; // Req 1.7

interface OtpRecord {
  code: string;
  expiresAt: number;
  requestTimestamps: number[];
  failedAttempts: number;
  lockedUntil: number | null;
}

export type VerifyResult =
  | { status: 'OK' }
  | { status: 'INVALID' }
  | { status: 'EXPIRED' }
  | { status: 'LOCKED'; retryAfterSec: number };

export interface RequestDecision {
  allowed: boolean;
  retryAfterSec?: number;
}

/**
 * In-memory OTP store enforcing the generation rate limit (Req 1.4), expiry
 * (Req 1.2/1.3), and failed-attempt lockout (Req 1.7). This is the dev
 * implementation; production swaps in a Redis-backed store with the same surface.
 */
@Injectable()
export class OtpStore {
  private readonly records = new Map<string, OtpRecord>();

  /** Checks whether a new OTP may be requested for this phone within the window. */
  canRequest(phone: string): RequestDecision {
    const record = this.records.get(phone);
    const now = Date.now();
    if (!record) {
      return { allowed: true };
    }
    if (record.lockedUntil && record.lockedUntil > now) {
      return { allowed: false, retryAfterSec: Math.ceil((record.lockedUntil - now) / 1000) };
    }
    const recent = record.requestTimestamps.filter((t) => now - t < REQUEST_WINDOW_MS);
    if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
      const oldest = Math.min(...recent);
      return { allowed: false, retryAfterSec: Math.ceil((oldest + REQUEST_WINDOW_MS - now) / 1000) };
    }
    return { allowed: true };
  }

  /** Stores a freshly generated OTP and records the request timestamp. */
  saveOtp(phone: string, code: string): void {
    const now = Date.now();
    const existing = this.records.get(phone);
    const requestTimestamps = (existing?.requestTimestamps ?? []).filter(
      (t) => now - t < REQUEST_WINDOW_MS,
    );
    requestTimestamps.push(now);
    this.records.set(phone, {
      code,
      expiresAt: now + OTP_TTL_MS,
      requestTimestamps,
      failedAttempts: existing?.failedAttempts ?? 0,
      lockedUntil: existing?.lockedUntil ?? null,
    });
  }

  /** Verifies a submitted OTP, applying expiry and lockout rules. */
  verify(phone: string, code: string): VerifyResult {
    const now = Date.now();
    const record = this.records.get(phone);

    if (record?.lockedUntil && record.lockedUntil > now) {
      return { status: 'LOCKED', retryAfterSec: Math.ceil((record.lockedUntil - now) / 1000) };
    }
    if (!record || !record.code) {
      return { status: 'EXPIRED' };
    }
    if (record.expiresAt < now) {
      return { status: 'EXPIRED' };
    }
    if (record.code !== code) {
      record.failedAttempts += 1;
      if (record.failedAttempts >= MAX_FAILED_VERIFICATIONS) {
        record.lockedUntil = now + LOCKOUT_MS;
        record.failedAttempts = 0;
        return { status: 'LOCKED', retryAfterSec: Math.ceil(LOCKOUT_MS / 1000) };
      }
      return { status: 'INVALID' };
    }
    // Success — invalidate the OTP so it cannot be reused (Req 1.2).
    record.code = '';
    record.failedAttempts = 0;
    record.lockedUntil = null;
    return { status: 'OK' };
  }
}
