// Centralized runtime configuration (Req 20.8). Values come from Expo env vars
// (EXPO_PUBLIC_*) with sensible local-development defaults.
import { NativeModules, Platform } from 'react-native';

const API_PORT = 3000;

// In Expo dev, the phone connects to the Metro bundler at the host PC's *current*
// LAN IP. We read that same IP from the bundler URL so the API base auto-tracks the
// machine — no manual edits when the router hands out a new DHCP address.
// e.g. scriptURL = "http://192.168.0.107:8081/index.bundle?platform=android..."
const getDevHostFromMetro = (): string | null => {
  const scriptURL = (NativeModules as { SourceCode?: { scriptURL?: string } })?.SourceCode
    ?.scriptURL;
  if (!scriptURL) return null;
  const match = scriptURL.match(/^https?:\/\/([^/:]+)/);
  const host = match?.[1];
  // Ignore the localhost/loopback case (real devices never use it).
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
};

const getDefaultApiUrl = (): string => {
  // Physical device / LAN: reuse whatever IP Metro is served from.
  const metroHost = getDevHostFromMetro();
  if (metroHost) return `http://${metroHost}:${API_PORT}/api`;
  // Fallbacks: Android emulator reaches the host via 10.0.2.2; iOS sim uses localhost.
  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}/api`;
  return `http://localhost:${API_PORT}/api`;
};

export const config = {
  // An explicit env override always wins (use it for staging/production builds).
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? getDefaultApiUrl(),
  // React Query default stale time (ms).
  defaultStaleTime: 60_000,
  // Max mutation retry attempts on reconnect (Req 16.3).
  mutationRetry: 3,
} as const;
