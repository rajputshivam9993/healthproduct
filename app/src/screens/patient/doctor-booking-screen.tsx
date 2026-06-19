import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, Clock, MapPin, Video } from 'lucide-react-native';
import { useAvailableSlots, useBookAndPay } from '../../hooks/use-appointments';
import type { Slot } from '../../services/slot-service';
import type { PatientStackParamList } from '../../navigation/types';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

/** Patient booking: pick an available slot, book, and pay (Req 7, 8). */
export function DoctorBookingScreen() {
  const route = useRoute<RouteProp<PatientStackParamList, 'DoctorBooking'>>();
  const { doctorId } = route.params;
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const { data: slots, isLoading } = useAvailableSlots(doctorId);
  const bookAndPay = useBookAndPay();
  const [selected, setSelected] = useState<string | null>(null);

  const sections = groupByDate(slots ?? []);

  const confirm = async () => {
    if (!selected) return;
    try {
      await bookAndPay.mutateAsync(selected);
      // Haptic confirmation on successful booking + payment (Req 18.9).
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Booked!', 'Your appointment is confirmed. See it under Appointments.');
      setSelected(null);
    } catch (err) {
      Alert.alert('Booking failed', extractError(err));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <ActivityIndicator color={c.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.heading}>Choose an available slot</Text>}
        ListEmptyComponent={
          <View style={styles.center}>
            <Clock color={c.textMuted} size={36} />
            <Text style={styles.empty}>No available slots in the next 30 days.</Text>
          </View>
        }
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => {
          const active = selected === item.id;
          return (
            <TouchableOpacity
              style={[styles.slot, active && styles.slotActive]}
              onPress={() => setSelected(item.id)}
            >
              {item.consultationType === 'VIDEO' ? (
                <Video color={active ? '#fff' : c.primary} size={18} />
              ) : (
                <MapPin color={active ? '#fff' : c.accent} size={18} />
              )}
              <Text style={[styles.slotText, active && styles.slotTextActive]}>{fmtTime(item.startTime)}</Text>
              {active && <CheckCircle2 color="#fff" size={18} />}
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cta, (!selected || bookAndPay.isPending) && styles.ctaDisabled]}
          onPress={confirm}
          disabled={!selected || bookAndPay.isPending}
        >
          {bookAndPay.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Book & Pay</Text>
          )}
        </TouchableOpacity>
      </View>
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

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

function extractError(err: unknown): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Try again.';
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  list: { padding: spacing.md, paddingBottom: 100 },
  heading: { ...typography.h3, color: c.text, marginBottom: spacing.sm },
  sectionHeader: { ...typography.caption, color: c.textMuted, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs },
  slot: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: c.background,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: c.border,
  },
  slotActive: { backgroundColor: c.primary, borderColor: c.primary },
  slotText: { ...typography.body, color: c.text, flex: 1 },
  slotTextActive: { color: '#fff', fontWeight: '600' },
  empty: { ...typography.body, color: c.textMuted, textAlign: 'center' },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md,
    backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border,
  },
  cta: { backgroundColor: c.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { ...typography.h3, color: '#fff' },
});
