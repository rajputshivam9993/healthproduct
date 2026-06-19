import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Monitor, Moon, Sun } from 'lucide-react-native';
import { usePreferencesStore, type ThemeMode } from '../stores/preferences-store';
import { usePalette, useThemedStyles } from '../theme/theme-context';
import { radius, spacing, typography, type Palette } from '../theme';

const OPTIONS: Array<{ mode: ThemeMode; label: string; Icon: typeof Sun }> = [
  { mode: 'light', label: 'Light', Icon: Sun },
  { mode: 'dark', label: 'Dark', Icon: Moon },
  { mode: 'system', label: 'System', Icon: Monitor },
];

/** Light / dark / system theme switcher (Req 18.8). */
export function ThemeToggle() {
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);

  return (
    <View style={styles.row}>
      {OPTIONS.map(({ mode, label, Icon }) => {
        const active = themeMode === mode;
        return (
          <TouchableOpacity
            key={mode}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => setThemeMode(mode)}
          >
            <Icon color={active ? '#fff' : c.textMuted} size={16} />
            <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.sm },
    chip: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
      paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: c.surface,
      borderWidth: 1, borderColor: c.border,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    text: { ...typography.caption, color: c.textMuted },
    textActive: { color: '#fff', fontWeight: '700' },
  });
