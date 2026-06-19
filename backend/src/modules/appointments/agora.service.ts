import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcRole, RtcTokenBuilder } from 'agora-token';

const GRACE_SECONDS = 10 * 60; // 10-minute grace after the appointment (Req 9.1)

export interface AgoraCredentials {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  expiresInSeconds: number;
  mock: boolean;
}

/**
 * Generates Agora RTC tokens for video consultations (Req 9.1, 9.7). The channel
 * name is the appointment UUID. When no Agora certificate is configured (dev), a
 * mock token is returned so the call-control flow is exercisable without keys.
 */
@Injectable()
export class AgoraService {
  private readonly appId: string;
  private readonly appCertificate: string;

  constructor(config: ConfigService) {
    this.appId = config.get<string>('integrations.agora.appId') ?? '';
    this.appCertificate = config.get<string>('integrations.agora.appCertificate') ?? '';
  }

  /**
   * Builds a token valid for the remaining appointment duration plus a 10-minute
   * grace period (Req 9.1). `uid` distinguishes participants on the channel.
   */
  buildToken(channel: string, uid: number, scheduledEnd: Date): AgoraCredentials {
    const remainingMs = new Date(scheduledEnd).getTime() - Date.now();
    const expiresInSeconds = Math.max(60, Math.floor(remainingMs / 1000) + GRACE_SECONDS);

    if (!this.appId || !this.appCertificate) {
      return { appId: this.appId, channel, token: `dev-agora-token:${channel}:${uid}`, uid, expiresInSeconds, mock: true };
    }

    const token = RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channel,
      uid,
      RtcRole.PUBLISHER,
      expiresInSeconds,
      expiresInSeconds,
    );
    return { appId: this.appId, channel, token, uid, expiresInSeconds, mock: false };
  }
}
