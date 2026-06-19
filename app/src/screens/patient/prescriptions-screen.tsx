import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Pill } from 'lucide-react-native';
import { useMyPrescriptions } from '../../hooks/use-patient-extras';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

/** Patient prescription history (Req 10.3). */
export function PrescriptionsScreen() {
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const { data, isLoading } = useMyPrescriptions();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isLoading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <FileText color={c.textMuted} size={36} />
              <Text style={styles.empty}>No prescriptions yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              {item.medications.map((m, i) => (
                <View key={i} style={styles.medRow}>
                  <Pill color={c.primary} size={16} />
                  <Text style={styles.med}>
                    <Text style={styles.medName}>{m.name}</Text> — {m.dosage}, {m.frequency}, {m.duration}
                  </Text>
                </View>
              ))}
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  list: { padding: spacing.md, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl },
  empty: { ...typography.body, color: c.textMuted },
  card: { backgroundColor: c.background, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  date: { ...typography.caption, color: c.textMuted, marginBottom: spacing.sm },
  medRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
  med: { ...typography.body, color: c.text, flex: 1 },
  medName: { fontWeight: '700' },
  notes: { ...typography.caption, color: c.textMuted, marginTop: spacing.sm, fontStyle: 'italic' },
});
