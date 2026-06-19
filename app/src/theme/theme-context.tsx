import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette, type Palette } from './index';
import { usePreferencesStore } from '../stores/preferences-store';

interface ThemeValue {
  palette: Palette;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeValue>({ palette: lightPalette, isDark: false });

/**
 * Provides the active palette based on the user's themeMode preference and the
 * system color scheme (Req 18.8). Wrap the app once; screens read it via the
 * hooks below.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = usePreferencesStore((s) => s.themeMode);
  const system = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  const value = useMemo<ThemeValue>(
    () => ({ palette: isDark ? darkPalette : lightPalette, isDark }),
    [isDark],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): ThemeValue => useContext(ThemeContext);
export const usePalette = (): Palette => useContext(ThemeContext).palette;

/** Builds StyleSheet styles from the active palette, memoized per palette. */
export function useThemedStyles<T>(factory: (c: Palette) => T): T {
  const { palette } = useTheme();
  return useMemo(() => factory(palette), [palette, factory]);
}
