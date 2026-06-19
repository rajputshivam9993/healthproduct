import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lightPalette, spacing, typography } from '../theme';

interface ScreenPlaceholderProps {
  title: string;
  subtitle?: string;
}

/**
 * Temporary scaffold screen body. Each real screen replaces this with its actual
 * UI as features are implemented. Centralised here so all stub screens stay
 * visually consistent and small (Req 20.1).
 */
export function ScreenPlaceholder({ title, subtitle }: ScreenPlaceholderProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle ?? 'Coming soon'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: lightPalette.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { ...typography.h2, color: lightPalette.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: lightPalette.textMuted },
});
