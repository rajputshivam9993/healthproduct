import { apiClient } from './api/client';
import type { AuthTokens, User } from '../types';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface OtpRequestResult {
  message: string;
  // Present only in backend dev mode (OTP not sent via SMS).
  devOtp?: string;
}

/** Patient/doctor OTP auth API calls (Req 1, 2). */
export const authService = {
  async requestOtp(phone: string): Promise<OtpRequestResult> {
    const { data } = await apiClient.post<OtpRequestResult>('/auth/otp/request', { phone });
    return data;
  },

  async verifyOtp(
    phone: string,
    otp: string,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const { data } = await apiClient.post<AuthResponse>('/auth/otp/verify', { phone, otp });
    return { user: data.user, tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken } };
  },
};
