import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Video, MapPin } from 'lucide-react-native';
import { useCreateSlot, useDeleteSlot, useMySlots } from '../../hooks/use-slots';
import type { Slot } from '../../services/slot-service';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

const TIMES = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
const DURATIONS = [30, 45, 60];

/** Doctor calendar: view availability slots + create new ones (Req 21.4, 21.8). */
export function DoctorCalendarScreen() {
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const { data: slots, isLoading } = useMySlots();
  const createSlot = useCreateSlot();
  const deleteSlot = useDeleteSlot();

  const [dayOffset, setDayOffset] = useState(0);
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState<'VIDEO' | 'IN_PERSON'>('VIDEO');

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
      }),
    [],
  );

  const sections = useMemo(() => groupByDate(slots ?? []), [slots]);

  const addSlot = async () => {
    const [h, m] = time.split(':').map(Number);
    const start = new Date(days[dayOffset]);
    start.setHours(h, m, 0, 0);
    if (start.getTime() <= Date.now()) {
      Alert.alert('Invalid time', 'Pick a future time.');
      return;
    }
    const end = new Date(start.getTime() + duration * 60 * 1000);
    try {
      await createSlot.mutateAsync({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        consultationType: type,
      });
    } catch (err) {
      Alert.alert('Could not create slot', extractError(err));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Calendar</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add availability</Text>
        <Label text="Day" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {days.map((d, i) => (
            <Chip key={i} label={fmtDay(d)} active={i === dayOffset} onPress={() => setDayOffset(i)} />
          ))}
        </ScrollView>
        <Label text="Start time" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {TIMES.map((t) => (
            <Chip key={t} label={t} active={t === time} onPress={() => setTime(t)} />
          ))}
        </ScrollView>
        <Label text="Duration" />
        <View style={styles.row}>
          {DURATIONS.map((d) => (
            <Chip key={d} label={`${d} min`} active={d === duration} onPress={() => setDuration(d)} />
          ))}
        </View>
        <Label text="Type" />
        <View style={styles.row}>
          <Chip label="Video" active={type === 'VIDEO'} onPress={() => setType('VIDEO')} />
          <Chip label="In-person" active={type === 'IN_PERSON'} onPress={() => setType('IN_PERSON')} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={addSlot} disabled={createSlot.isPending}>
          {createSlot.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Plus color="#fff" size={18} />
              <Text style={styles.addBtnText}>Add slot</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No slots yet. Add availability above.</Text>}
          renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
          renderItem={({ item }) => (
            <View style={styles.slot}>
              {item.consultationType === 'VIDEO' ? (
                <Video color={c.primary} size={18} />
              ) : (
                <MapPin color={c.accent} size={18} />
              )}
              <Text style={styles.slotTime}>
                {fmtTime(item.startTime)} – {fmtTime(item.endTime)}
              </Text>
              {item.isBooked ? (
                <Text style={styles.booked}>Booked</Text>
              ) : (
                <TouchableOpacity onPress={() => deleteSlot.mutate(item.id)}>
                  <Trash2 color={c.danger} size={18} />
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function groupByDate(slots: Slot[]) {
  const map = new Map<string, Slot[]>();
  for (const s of [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime))) {
    const key = new Date(s.startTime).toDateString();
    map.set(key, [...(map.get(key) ?? []), s]);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

function extractError(err: unknown): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Try again.';
}

function Label({ text }: { text: string }) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.label}>{text}</Text>;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  title: { ...typography.h1, color: c.text, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  card: {
    backgroundColor: c.background, borderRadius: radius.lg, padding: spacing.md, margin: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTitle: { ...typography.h3, color: c.text, marginBottom: spacing.sm },
  label: { ...typography.caption, color: c.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs },
  chips: { gap: spacing.sm, paddingVertical: 2 },
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
  },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { ...typography.caption, color: c.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  addBtn: {
    flexDirection: 'row', gap: spacing.xs, backgroundColor: c.primary, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md,
  },
  addBtnText: { ...typography.h3, color: '#fff' },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  sectionHeader: { ...typography.caption, color: c.textMuted, marginTop: spacing.md, marginBottom: spacing.xs, fontWeight: '700' },
  slot: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: c.background,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  slotTime: { ...typography.body, color: c.text, flex: 1 },
  booked: { ...typography.caption, color: c.textMuted },
  empty: { ...typography.body, color: c.textMuted, textAlign: 'center', marginTop: spacing.lg },
});
