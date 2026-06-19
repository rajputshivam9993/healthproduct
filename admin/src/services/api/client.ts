import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/constants/config';
import { useAuthStore } from '@/stores/auth-store';

// Shared Axios instance (Req 17.1). Attaches the access token to every request
// and transparently refreshes it once on 401 (Req 17.14); if refresh fails the
// session is cleared so the router redirects to /login (Req 17.15).
export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15_000,
});

apiClient.interceptors.request.use((request) => {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

// Tracks retried requests so a failed refresh doesn't loop.
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const refreshToken = useAuthStore.getState().tokens?.refreshToken;
    const isAuthCall = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && original && !original._retried && refreshToken && !isAuthCall) {
      original._retried = true;
      try {
        const { data } = await axios.post(`${config.apiBaseUrl}/auth/refresh`, { refreshToken });
        const tokens = { accessToken: data.accessToken, refreshToken: data.refreshToken };
        useAuthStore.getState().setTokens(tokens);
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().clearSession();
      }
    }
    return Promise.reject(error);
  },
);
