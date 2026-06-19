import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MapPin, SearchX } from 'lucide-react-native';
import { DoctorCard } from '../../components/doctor-card';
import { SkeletonCard } from '../../components/skeleton';
import { useDoctorSearch } from '../../hooks/use-doctor-search';
import type { PatientNav } from '../../navigation/types';
import { CITY_OPTIONS, SPECIALIZATIONS } from '../../constants/locations';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

/** Patient home: location + specialization doctor search (Req 5, 18.5). */
export function PatientHomeScreen() {
  const navigation = useNavigation<PatientNav>();
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const [cityIndex, setCityIndex] = useState(0);
  const [specialization, setSpecialization] = useState<string | null>(null);
  const city = CITY_OPTIONS[cityIndex];

  const { data, isLoading, isError } = useDoctorSearch(
    {
      latitude: city.latitude,
      longitude: city.longitude,
      radiusKm: 50,
      specialization: specialization ?? undefined,
    },
    true,
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Doctors</Text>
        <View style={styles.locationRow}>
          <MapPin color={c.primary} size={16} />
          <Text style={styles.locationText}>Near {city.label}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
        {CITY_OPTIONS.map((c, i) => (
          <Chip key={c.label} label={c.label} active={i === cityIndex} onPress={() => setCityIndex(i)} />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
        <Chip label="All" active={specialization === null} onPress={() => setSpecialization(null)} />
        {SPECIALIZATIONS.map((s) => (
          <Chip key={s} label={s} active={specialization === s} onPress={() => setSpecialization(s)} />
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState text="Could not load doctors. Check your connection." />
      ) : data && data.items.length > 0 ? (
        <FlatList
          data={data.items}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              onPress={() =>
                navigation.navigate('DoctorBooking', { doctorId: item.id, name: item.name ?? 'Doctor' })
              }
            />
          )}
        />
      ) : (
        <EmptyState text={data?.suggestion ?? 'No doctors found nearby.'} />
      )}
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ text }: { text: string }) {
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.center}>
      <SearchX color={c.textMuted} size={40} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  title: { ...typography.h1, color: c.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { ...typography.body, color: c.textMuted },
  chipsRow: { flexGrow: 0, marginTop: spacing.sm },
  chipsContent: { paddingHorizontal: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill,
    backgroundColor: c.background, borderWidth: 1, borderColor: c.border,
  },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { ...typography.caption, color: c.textMuted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  emptyText: { ...typography.body, color: c.textMuted, textAlign: 'center' },
});
