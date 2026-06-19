import { Injectable } from '@nestjs/common';

/**
 * In-memory refresh-token store keyed by user + device fingerprint (Req 3.3).
 * Holds exactly one valid token per device, enabling rotation (Req 3.1) and
 * per-device / all-device logout (Req 3.4/3.5). Production swaps in Redis
 * (Refresh_Token_Store) with the same surface.
 */
@Injectable()
export class RefreshTokenStore {
  private readonly tokensByUserDevice = new Map<string, string>();

  private key(userId: string, deviceId: string): string {
    return `${userId}:${deviceId}`;
  }

  /** Saves (or rotates) the valid refresh token for a user's device. */
  save(userId: string, deviceId: string, token: string): void {
    this.tokensByUserDevice.set(this.key(userId, deviceId), token);
  }

  /** Returns true only if the presented token is the current one for the device. */
  isValid(userId: string, deviceId: string, token: string): boolean {
    return this.tokensByUserDevice.get(this.key(userId, deviceId)) === token;
  }

  /** Removes the token for one device (single-device logout, Req 3.4). */
  remove(userId: string, deviceId: string): void {
    this.tokensByUserDevice.delete(this.key(userId, deviceId));
  }

  /** Removes all tokens for a user (all-device logout, Req 3.5). */
  removeAllForUser(userId: string): void {
    const prefix = `${userId}:`;
    for (const key of this.tokensByUserDevice.keys()) {
      if (key.startsWith(prefix)) {
        this.tokensByUserDevice.delete(key);
      }
    }
  }
}
