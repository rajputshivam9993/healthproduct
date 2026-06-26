import React from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { CalendarDays, MapPin, Video } from 'lucide-react-native';
import { useAvailableSlots } from '../../hooks/use-appointments';
import type { Slot } from '../../services/slot-service';
import type { PatientStackParamList, PatientNav } from '../../navigation/types';
import { radius, spacing, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

/** Patient booking: pick an available slot, then proceed to patient details. */
export function DoctorBookingScreen() {
  const route = useRoute<RouteProp<PatientStackParamList, 'DoctorBooking'>>();
  const navigation = useNavigation<PatientNav>();
  const { doctorId } = route.params;
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const { data: slots, isLoading } = useAvailableSlots(doctorId);

  const sections = groupByDate(slots ?? []);
  const totalSlots = slots?.length ?? 0;

  const handleSlotPress = (slotId: string) => {
    navigation.navigate('PatientDetail', { slotId });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.map((s) => s.id).join('-')}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Select a Time Slot</Text>
            {totalSlots > 0 && (
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeText}>{totalSlots} available</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <CalendarDays color={c.textMuted} size={36} />
            </View>
            <Text style={styles.emptyTitle}>No Slots Available</Text>
            <Text style={styles.emptyText}>
              This doctor has no available slots in the next 30 days. Please check back later.
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.dateHeader}>
            <View style={styles.dateIconWrap}>
              <CalendarDays color={c.primary} size={14} />
            </View>
            <Text style={styles.dateText}>{formatSectionDate(section.title)}</Text>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>{section.data.length} slots</Text>
            </View>
          </View>
        )}
        renderItem={({ item: pair }) => (
          <View style={styles.slotRow}>
            {pair.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.slotCard}
                onPress={() => handleSlotPress(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.slotIconWrap, item.consultationType === 'VIDEO' ? styles.slotIconVideo : styles.slotIconInPerson]}>
                  {item.consultationType === 'VIDEO' ? (
                    <Video color="#fff" size={14} />
                  ) : (
                    <MapPin color="#fff" size={14} />
                  )}
                </View>
                <View style={styles.slotInfo}>
                  <Text style={styles.slotTime}>{fmtTime(item.startTime)}</Text>
                  <Text style={styles.slotType}>
                    {item.consultationType === 'VIDEO' ? 'Video' : 'In-Person'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {pair.length === 1 && <View style={styles.slotCardPlaceholder} />}
          </View>
        )}
      />
    </View>
  );
}

function groupByDate(slots: Slot[]) {
  const map = new Map<string, Slot[]>();
  for (const s of [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime))) {
    const key = new Date(s.startTime).toDateString();
    map.set(key, [...(map.get(key) ?? []), s]);
  }
  // Group each section's data into pairs for 2-column layout
  return Array.from(map.entries()).map(([title, data]) => {
    const paired: Slot[][] = [];
    for (let i = 0; i < data.length; i += 2) {
      paired.push(data.slice(i, i + 2));
    }
    return { title, data: paired };
  });
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

/** Format "Mon Jun 20 2025" to a nicer "Mon, 20 Jun 2025" */
function formatSectionDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // List
    list: { paddingHorizontal: spacing.md + 4, paddingBottom: 100, paddingTop: spacing.md },

    // Section title
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
    },

    // Date section headers
    dateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      paddingVertical: spacing.xs,
    },
    dateIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: c.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateText: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
      flex: 1,
    },
    dateBadge: {
      backgroundColor: c.primaryMuted,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    dateBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: c.primary,
    },

    // Slot cards — 2 per row
    slotRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    slotCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.background,
      borderRadius: 14,
      padding: spacing.sm + 4,
      borderWidth: 1.5,
      borderColor: c.border,
      shadowColor: c.primary,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    slotCardPlaceholder: { flex: 1 },
    slotIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    slotIconVideo: { backgroundColor: c.primary },
    slotIconInPerson: { backgroundColor: '#22C55E' },
    slotInfo: { flex: 1 },
    slotTime: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    slotType: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 1,
    },

    // Empty state
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      paddingVertical: spacing.xl + spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    emptyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: c.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    emptyText: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
