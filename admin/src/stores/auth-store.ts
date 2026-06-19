import { create } from 'zustand';
import type { AdminUser, AuthTokens } from '@/types';

const STORAGE_KEY = 'doctor360.admin.session';

interface PersistedSession {
  user: AdminUser;
  tokens: AuthTokens;
}

// Admin authentication state (Req 17.2/17.13). Tokens are persisted to
// localStorage so a page refresh keeps the admin signed in.
interface AuthState {
  user: AdminUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setSession: (user: AdminUser, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearSession: () => void;
}

function loadSession(): PersistedSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as PersistedSession) : null;
}

const persisted = loadSession();

export const useAuthStore = create<AuthState>((set) => ({
  user: persisted?.user ?? null,
  tokens: persisted?.tokens ?? null,
  isAuthenticated: Boolean(persisted),

  setSession: (user, tokens) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, tokens }));
    set({ user, tokens, isAuthenticated: true });
  },

  setTokens: (tokens) => {
    const { user } = useAuthStore.getState();
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, tokens }));
    }
    set({ tokens });
  },

  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, tokens: null, isAuthenticated: false });
  },
}));
