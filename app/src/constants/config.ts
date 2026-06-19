// Centralized runtime configuration (Req 20.8). Values come from Expo env vars
// (EXPO_PUBLIC_*) with sensible local-development defaults.

export const config = {
  // Android emulators reach the host machine via 10.0.2.2; override per platform/env as needed.
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api',
  // React Query default stale time (ms).
  defaultStaleTime: 60_000,
  // Max mutation retry attempts on reconnect (Req 16.3).
  mutationRetry: 3,
} as const;
