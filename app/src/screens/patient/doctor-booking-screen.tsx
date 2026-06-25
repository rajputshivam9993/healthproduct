import React from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Clock, MapPin, Video } from 'lucide-react-native';
import { useAvailableSlots } from '../../hooks/use-appointments';
import type { Slot } from '../../services/slot-service';
import type { PatientStackParamList, PatientNav } from '../../navigation/types';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

/** Patient booking: pick an available slot, then proceed to patient details (Req 7, 8). */
export function DoctorBookingScreen() {
  const route = useRoute<RouteProp<PatientStackParamList, 'DoctorBooking'>>();
  const navigation = useNavigation<PatientNav>();
  const { doctorId } = route.params;
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const { data: slots, isLoading } = useAvailableSlots(doctorId);

  const sections = groupByDate(slots ?? []);

  const handleSlotPress = (slotId: string) => {
    navigation.navigate('PatientDetail', { slotId });
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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.slot}
            onPress={() => handleSlotPress(item.id)}
          >
            {item.consultationType === 'VIDEO' ? (
              <Video color={c.primary} size={18} />
            ) : (
              <MapPin color={c.accent} size={18} />
            )}
            <Text style={styles.slotText}>{fmtTime(item.startTime)}</Text>
          </TouchableOpacity>
        )}
      />
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
  slotText: { ...typography.body, color: c.text, flex: 1 },
  empty: { ...typography.body, color: c.textMuted, textAlign: 'center' },
});
