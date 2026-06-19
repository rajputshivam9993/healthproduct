import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// User preferences (Req 16.5, 18.8): theme mode toggle persisted to AsyncStorage.
export type ThemeMode = 'light' | 'dark' | 'system';

interface PreferencesState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'doctor360-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
