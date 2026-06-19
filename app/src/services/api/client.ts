import axios from 'axios';
import { config } from '../../constants/config';
import { useAuthStore } from '../../stores/auth-store';

// Shared Axios instance (Req 20.5 service layer). Attaches the access token to
// every request; automatic refresh-on-401 is wired with the Auth feature (Req 3).
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
