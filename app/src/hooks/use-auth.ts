import { useAuthStore } from '../stores/auth-store';

/**
 * Convenience hook exposing authentication state and actions to screens, keeping
 * components free of store-wiring details (Req 20.12).
 */
export function useAuth() {
  const { user, role, isAuthenticated, setSession, clearSession } = useAuthStore();
  return { user, role, isAuthenticated, setSession, logout: clearSession };
}
