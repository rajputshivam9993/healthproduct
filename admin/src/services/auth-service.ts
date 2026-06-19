import { apiClient } from './api/client';
import type { AdminUser, AuthTokens } from '@/types';

interface AuthResponse {
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
}

/** Admin auth API calls (Req 17.2, 17.14). */
export const authService = {
  async login(email: string, password: string): Promise<{ user: AdminUser; tokens: AuthTokens }> {
    const { data } = await apiClient.post<AuthResponse>('/auth/admin/login', { email, password });
    return { user: data.user, tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken } };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  },
};
