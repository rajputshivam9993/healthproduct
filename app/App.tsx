import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { queryClient } from './src/lib/query-client';
import { asyncStoragePersister, wireOnlineManager } from './src/lib/persister';
import { RootNavigator } from './src/navigation/root-navigator';
import { AnimatedSplash } from './src/components/animated-splash';
import { OfflineIndicator } from './src/components/offline-indicator';
import { ThemeProvider, useTheme } from './src/theme/theme-context';

// Connect device connectivity to React Query (pause/resume on reconnect, Req 16.3).
wireOnlineManager();

const ONE_DAY = 1000 * 60 * 60 * 24;

/** Navigation themed from the active palette so headers/tab bars follow dark mode. */
function ThemedNavigation() {
  const { palette, isDark } = useTheme();
  const navTheme: Theme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <OfflineIndicator />
      <RootNavigator />
    </NavigationContainer>
  );
}

/**
 * App root: animated splash (Req 18.1), then themed providers — gesture handling,
 * safe areas, persisted React Query cache (Req 16), dark-mode theme (Req 18.8),
 * and navigation.
 */
export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: asyncStoragePersister, maxAge: ONE_DAY }}
          >
            {!splashDone ? (
              <AnimatedSplash onDone={() => setSplashDone(true)} />
            ) : (
              <ThemedNavigation />
            )}
            <StatusBar style="auto" />
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
