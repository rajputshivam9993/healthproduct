import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import {
  Bell,
  ChevronDown,
  Crosshair,
  Heart,
  MapPin,
  Search,
  SearchX,
  Stethoscope,
  Brain,
  Baby,
  Bone,
  Activity,
} from 'lucide-react-native';
import { DoctorCard } from '../../components/doctor-card';
import { SkeletonCard } from '../../components/skeleton';
import { useDoctorSearch } from '../../hooks/use-doctor-search';
import { useSpecializations } from '../../hooks/use-specializations';
import type { PatientNav } from '../../navigation/types';
import { CITY_OPTIONS } from '../../constants/locations';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const GRID_GAP = 10;
// Exactly 3 per row: subtract padding and gaps, divide by 3
const CATEGORY_CARD_SIZE = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3);

// Category visual config — maps specialization names to icons and colors.
// Only the first 6 from the API response are shown in the grid.
const CATEGORY_STYLES: Record<string, { Icon: React.ComponentType<{ color: string; size: number }>; bg: string; color: string }> = {
  'General Physician': { Icon: Stethoscope, bg: '#EEF4FF', color: '#3B82F6' },
  'Cardiologist': { Icon: Heart, bg: '#FEF1F1', color: '#EF4444' },
  'Dermatologist': { Icon: Activity, bg: '#F0FDF4', color: '#22C55E' },
  'Pediatrician': { Icon: Baby, bg: '#FFF7ED', color: '#F97316' },
  'Orthopedic': { Icon: Bone, bg: '#F5F3FF', color: '#8B5CF6' },
  'Neurologist': { Icon: Brain, bg: '#FDF4FF', color: '#D946EF' },
  'Gynecologist': { Icon: Heart, bg: '#FEF1F1', color: '#EC4899' },
  'Psychiatrist': { Icon: Brain, bg: '#EEF4FF', color: '#6366F1' },
  'Dentist': { Icon: Stethoscope, bg: '#ECFEFF', color: '#06B6D4' },
  'ENT Specialist': { Icon: Activity, bg: '#FEF9C3', color: '#CA8A04' },
  'Ophthalmologist': { Icon: Stethoscope, bg: '#FEF9C3', color: '#CA8A04' },
  'Gastroenterologist': { Icon: Activity, bg: '#F0FDFA', color: '#14B8A6' },
  'Urologist': { Icon: Stethoscope, bg: '#EEF4FF', color: '#3B82F6' },
  'Endocrinologist': { Icon: Activity, bg: '#F5F3FF', color: '#8B5CF6' },
  'Pulmonologist': { Icon: Stethoscope, bg: '#F0FDF4', color: '#22C55E' },
};

const DEFAULT_CATEGORY_STYLE = { Icon: Stethoscope, bg: '#EEF4FF', color: '#3B82F6' };

interface LocationState {
  label: string;
  latitude: number;
  longitude: number;
  isCurrentLocation: boolean;
}

/** Find the nearest city option (with coordinates) from CITY_OPTIONS. */
function getNearestCity(lat: number, lng: number): (typeof CITY_OPTIONS)[number] {
  let nearest = CITY_OPTIONS[0];
  let minDist = Number.MAX_VALUE;
  for (const city of CITY_OPTIONS) {
    const dLat = lat - city.latitude;
    const dLng = lng - city.longitude;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  }
  return nearest;
}

/** Patient home: location selector, search, specialization grid, doctor list (Req 5, 18.5). */
export function PatientHomeScreen() {
  const navigation = useNavigation<PatientNav>();
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);

  const [location, setLocation] = useState<LocationState>({
    label: CITY_OPTIONS[0].label,
    latitude: CITY_OPTIONS[0].latitude,
    longitude: CITY_OPTIONS[0].longitude,
    isCurrentLocation: false,
  });
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [specialization, setSpecialization] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Fetch specializations from the backend
  const { data: specData } = useSpecializations();
  const allSpecializations = specData?.specializations ?? [];
  // Show first 6 in the category grid
  const gridCategories = allSpecializations.slice(0, 6);

  const { data, isLoading, isError } = useDoctorSearch(
    {
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm: 50,
      specialization: specialization ?? undefined,
    },
    true,
  );

  const selectCity = (city: (typeof CITY_OPTIONS)[number]) => {
    setLocation({
      label: city.label,
      latitude: city.latitude,
      longitude: city.longitude,
      isCurrentLocation: false,
    });
    setShowCityPicker(false);
  };

  const useCurrentLocation = useCallback(async () => {
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission denied',
          'Enable location permission in settings to use current location.',
        );
        setFetchingLocation(false);
        return;
      }

      let pos: Location.LocationObject | null = null;
      try {
        pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
        });
      } catch {
        pos = await Location.getLastKnownPositionAsync();
      }

      if (pos) {
        let locationLabel = '';
        try {
          const results = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          if (results && results.length > 0) {
            const place = results[0];
            const parts = [
              place.name,
              place.street,
              place.district,
              place.subregion,
              place.city,
              place.region,
            ].filter(Boolean);
            const unique = [...new Set(parts)];
            locationLabel = unique.slice(0, 2).join(', ');
          }
        } catch {
          // Geocoding unavailable on emulators.
        }

        const nearestCity = getNearestCity(pos.coords.latitude, pos.coords.longitude);
        const dLat = pos.coords.latitude - nearestCity.latitude;
        const dLng = pos.coords.longitude - nearestCity.longitude;
        const distDeg = Math.sqrt(dLat * dLat + dLng * dLng);
        const isTooFar = distDeg > 5;

        if (!locationLabel) {
          locationLabel = nearestCity.label;
        }

        setLocation({
          label: locationLabel,
          latitude: isTooFar ? nearestCity.latitude : pos.coords.latitude,
          longitude: isTooFar ? nearestCity.longitude : pos.coords.longitude,
          isCurrentLocation: true,
        });
        setShowCityPicker(false);
      } else {
        setLocation({
          label: CITY_OPTIONS[0].label,
          latitude: CITY_OPTIONS[0].latitude,
          longitude: CITY_OPTIONS[0].longitude,
          isCurrentLocation: true,
        });
        setShowCityPicker(false);
        Alert.alert(
          'Location unavailable',
          'Could not determine your exact location. Showing results for ' + CITY_OPTIONS[0].label + '.',
        );
      }
    } catch {
      setLocation({
        label: CITY_OPTIONS[0].label,
        latitude: CITY_OPTIONS[0].latitude,
        longitude: CITY_OPTIONS[0].longitude,
        isCurrentLocation: true,
      });
      setShowCityPicker(false);
      Alert.alert(
        'Location unavailable',
        'Could not determine your exact location. Showing results for ' + CITY_OPTIONS[0].label + '.',
      );
    } finally {
      setFetchingLocation(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={isLoading ? [] : data?.items ?? []}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* ─── Top bar: Location + Notification ─── */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.locationSelector}
                onPress={() => setShowCityPicker(!showCityPicker)}
                activeOpacity={0.7}
              >
                <View style={styles.locationIconWrap}>
                  <MapPin color="#fff" size={14} />
                </View>
                <View style={styles.locationTextWrap}>
                  <Text style={styles.locationLabel}>Your Location</Text>
                  <View style={styles.locationValueRow}>
                    <Text style={styles.locationValue} numberOfLines={1}>
                      {location.label}
                    </Text>
                    <ChevronDown color={c.textMuted} size={14} />
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
                <Bell color={c.text} size={20} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>

            {/* ─── Location picker dropdown ─── */}
            {showCityPicker && (
              <View style={styles.cityDropdown}>
                <TouchableOpacity
                  style={styles.currentLocationOption}
                  onPress={useCurrentLocation}
                  disabled={fetchingLocation}
                  activeOpacity={0.7}
                >
                  <View style={styles.currentLocIconWrap}>
                    <Crosshair color="#fff" size={16} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.currentLocationText}>Use Current Location</Text>
                    <Text style={styles.currentLocationHint}>
                      {fetchingLocation ? 'Detecting...' : 'Using GPS'}
                    </Text>
                  </View>
                  {fetchingLocation && <ActivityIndicator size="small" color={c.primary} />}
                </TouchableOpacity>

                <View style={styles.dropdownDivider} />

                <Text style={styles.dropdownSectionLabel}>Suggested Cities</Text>
                {CITY_OPTIONS.map((city) => {
                  const isSelected = !location.isCurrentLocation && location.label === city.label;
                  return (
                    <TouchableOpacity
                      key={city.label}
                      style={[styles.cityOption, isSelected && styles.cityOptionActive]}
                      onPress={() => selectCity(city)}
                      activeOpacity={0.7}
                    >
                      <MapPin color={isSelected ? c.primary : c.textMuted} size={14} />
                      <Text style={[styles.cityOptionText, isSelected && styles.cityOptionTextActive]}>
                        {city.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ─── Search bar ─── */}
            <View style={styles.searchSection}>
              <Text style={styles.greeting}>What are you looking for?</Text>
              <View style={styles.searchBar}>
                <Search color={c.textMuted} size={18} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search doctor, speciality, etc."
                  placeholderTextColor={c.textMuted}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
            </View>

            {/* ─── Categories (3 per row) ─── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity onPress={() => setSpecialization(null)}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.categoryGrid}>
              {gridCategories.map((specName, index) => {
                const isActive = specialization === specName;
                const catStyle = CATEGORY_STYLES[specName] ?? DEFAULT_CATEGORY_STYLE;
                const CatIcon = catStyle.Icon;
                const isEndOfRow = (index + 1) % 3 === 0;
                return (
                  <TouchableOpacity
                    key={specName}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: isActive ? catStyle.color : catStyle.bg },
                      !isEndOfRow && { marginRight: GRID_GAP },
                      index >= 3 && { marginTop: GRID_GAP },
                    ]}
                    onPress={() => setSpecialization(isActive ? null : specName)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.categoryIconWrap,
                        { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.9)' },
                      ]}
                    >
                      <CatIcon color={isActive ? '#fff' : catStyle.color} size={24} />
                    </View>
                    <Text
                      style={[
                        styles.categoryLabel,
                        { color: isActive ? '#fff' : catStyle.color },
                      ]}
                      numberOfLines={2}
                    >
                      {specName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ─── Filter chips ─── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsRow}
              contentContainerStyle={styles.chipsContent}
            >
              <Chip label="All" active={specialization === null} onPress={() => setSpecialization(null)} />
              {allSpecializations.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={specialization === s}
                  onPress={() => setSpecialization(specialization === s ? null : s)}
                />
              ))}
            </ScrollView>

            {/* ─── Nearby Doctors header ─── */}
            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderTitle}>Nearby Doctors</Text>
              {data && (
                <Text style={styles.resultCount}>
                  {data.total} {data.total === 1 ? 'doctor' : 'doctors'}
                </Text>
              )}
            </View>

            {isLoading && (
              <View style={styles.loadingWrap}>
                {[0, 1, 2].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </View>
            )}
            {isError && <EmptyState text="Could not load doctors. Check your connection." />}
            {!isLoading && !isError && data && data.items.length === 0 && (
              <EmptyState text={data.suggestion ?? 'No doctors found nearby. Try a different location.'} />
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.doctorCardWrap}>
            <DoctorCard
              doctor={item}
              onPress={() =>
                navigation.navigate('DoctorBooking', {
                  doctorId: item.id,
                  name: item.name ?? 'Doctor',
                })
              }
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      style={[styles.chip, active && { backgroundColor: c.primary, borderColor: c.primary }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ text }: { text: string }) {
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <SearchX color={c.textMuted} size={36} />
      </View>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    listContent: { paddingBottom: 100 },

    // ─── Top Bar ───
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md + 4,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    locationSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    locationIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationTextWrap: { flex: 1 },
    locationLabel: { fontSize: 11, color: c.textMuted, marginBottom: 1 },
    locationValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationValue: { fontSize: 15, color: c.text, fontWeight: '700' },
    notificationBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    notificationDot: {
      position: 'absolute',
      top: 9,
      right: 9,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.danger,
      borderWidth: 2,
      borderColor: c.background,
    },

    // ─── Dropdown ───
    cityDropdown: {
      marginHorizontal: spacing.md + 4,
      marginBottom: spacing.md,
      backgroundColor: c.background,
      borderRadius: 16,
      padding: spacing.md,
      elevation: 8,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      borderWidth: 1,
      borderColor: c.border,
    },
    currentLocationOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm,
      borderRadius: 12,
    },
    currentLocIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    currentLocationText: {
      fontSize: 14,
      color: c.primary,
      fontWeight: '700',
    },
    currentLocationHint: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 1,
    },
    dropdownDivider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: spacing.sm + 2,
    },
    dropdownSectionLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontWeight: '600',
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    cityOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
    },
    cityOptionActive: { backgroundColor: c.primaryMuted },
    cityOptionText: { fontSize: 14, color: c.text },
    cityOptionTextActive: { color: c.primary, fontWeight: '600' },

    // ─── Search ───
    searchSection: {
      paddingHorizontal: spacing.md + 4,
      marginTop: spacing.sm,
    },
    greeting: {
      fontSize: 20,
      fontWeight: '800',
      color: c.text,
      marginBottom: spacing.sm + 2,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      gap: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: c.text,
      padding: 0,
    },

    // ─── Categories (3 per row) ───
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md + 4,
      marginTop: spacing.lg + 4,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
    },
    seeAll: {
      fontSize: 13,
      color: c.primary,
      fontWeight: '600',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: GRID_PADDING,
    },
    categoryCard: {
      width: CATEGORY_CARD_SIZE,
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      borderRadius: 16,
    },
    categoryIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    categoryLabel: {
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 14,
    },

    // ─── Filter Chips ───
    chipsRow: { flexGrow: 0, marginTop: spacing.lg },
    chipsContent: { paddingHorizontal: spacing.md + 4, gap: spacing.sm },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    chipText: { fontSize: 12, fontWeight: '500', color: c.textMuted },
    chipTextActive: { color: '#fff', fontWeight: '700' },

    // ─── Doctor List ───
    listHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md + 4,
      marginTop: spacing.lg + 4,
      marginBottom: spacing.sm,
    },
    listHeaderTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
    },
    resultCount: {
      fontSize: 12,
      color: c.textMuted,
      backgroundColor: c.surface,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    doctorCardWrap: {
      paddingHorizontal: spacing.md + 4,
    },
    loadingWrap: {
      paddingHorizontal: spacing.md + 4,
    },

    // ─── Empty State ───
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
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
