import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Video } from 'lucide-react-native';
import { useAppointments } from '../../hooks/use-appointments';
import { AppointmentStatusBadge } from '../../components/appointment-status-badge';
import type { Appointment } from '../../services/appointment-service';
import type { DoctorNav } from '../../navigation/types';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

/** Doctor consultations: upcoming/past tabs with Join for video (Req 21.5). */
export function DoctorConsultationsScreen() {
  const navigation = useNavigation<DoctorNav>();
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const { data: appts, isLoading } = useAppointments();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const now = Date.now();
  const list = (appts ?? [])
    .filter((a) =>
      tab === 'upcoming'
        ? new Date(a.scheduledStart).getTime() >= now && a.status !== 'CANCELLED' && a.status !== 'COMPLETED'
        : new Date(a.scheduledStart).getTime() < now || a.status === 'COMPLETED' || a.status === 'CANCELLED',
    )
    .sort((a, b) =>
      tab === 'upcoming'
        ? new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
        : new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime(),
    );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Consultations</Text>
      <View style={styles.tabs}>
        <Tab label="Upcoming" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <Tab label="Past" active={tab === 'past'} onPress={() => setTab('past')} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No {tab} consultations.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ConsultationDetail', { appointmentId: item.id })}
            >
              <View style={styles.cardTop}>
                {item.consultationType === 'VIDEO' ? (
                  <Video color={c.primary} size={18} />
                ) : (
                  <MapPin color={c.accent} size={18} />
                )}
                <Text style={styles.name}>{item.patient?.name ?? 'Patient'}</Text>
                <AppointmentStatusBadge status={item.status} />
              </View>
              <Text style={styles.time}>{new Date(item.scheduledStart).toLocaleString()}</Text>
              {item.consultationType === 'VIDEO' && item.status === 'CONFIRMED' && (
                <TouchableOpacity
                  style={styles.join}
                  onPress={() =>
                    navigation.navigate('VideoCall', { appointmentId: item.id, peerName: item.patient?.name ?? 'Patient' })
                  }
                >
                  <Text style={styles.joinText}>Join</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  title: { ...typography.h1, color: c.text, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  tabs: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.md, backgroundColor: c.background },
  tabActive: { backgroundColor: c.primary },
  tabText: { ...typography.body, color: c.textMuted },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  empty: { ...typography.body, color: c.textMuted, textAlign: 'center', marginTop: spacing.xl },
  card: { backgroundColor: c.background, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.h3, color: c.text, flex: 1 },
  time: { ...typography.caption, color: c.textMuted, marginTop: spacing.xs },
  join: { alignSelf: 'flex-start', marginTop: spacing.sm, backgroundColor: c.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  joinText: { ...typography.caption, color: '#fff', fontWeight: '700' },
});
