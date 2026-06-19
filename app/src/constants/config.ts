// Centralized runtime configuration (Req 20.8). Values come from Expo env vars
// (EXPO_PUBLIC_*) with sensible local-development defaults.
import { Platform } from 'react-native';

// Android emulators reach the host machine via 10.0.2.2; iOS simulators use localhost.
const getDefaultApiUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://localhost:3000/api';
};

export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? getDefaultApiUrl(),
  // React Query default stale time (ms).
  defaultStaleTime: 60_000,
  // Max mutation retry attempts on reconnect (Req 16.3).
  mutationRetry: 3,
} as const;
