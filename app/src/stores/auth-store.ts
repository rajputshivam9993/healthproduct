import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthTokens, User, UserRole } from '../types';

// Global authentication state (Req 16.5). The stored role drives which tab
// navigator is rendered after login (Req 21.1). Session is persisted to
// AsyncStorage (Expo Go-compatible) via zustand's persist middleware, which
// rehydrates asynchronously on app start.
interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  // True once AsyncStorage has finished rehydrating, so the UI can wait before
  // deciding which navigator to show (Req 18.11 — avoid auth flicker).
  hasHydrated: boolean;
  setSession: (user: User, tokens: AuthTokens) => void;
  clearSession: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      role: null,
      hasHydrated: false,

      setSession: (user, tokens) =>
        set({ user, tokens, isAuthenticated: true, role: user.role }),

      clearSession: () =>
        set({ user: null, tokens: null, isAuthenticated: false, role: null }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'doctor360-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the session fields, not transient flags/actions.
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
