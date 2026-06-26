import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Activity,
  Baby,
  Bone,
  Brain,
  ChevronRight,
  Heart,
  Stethoscope,
} from 'lucide-react-native';
import { useSpecializations } from '../../hooks/use-specializations';
import type { PatientNav } from '../../navigation/types';
import { radius, spacing, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

// Icon + color mapping for specializations (same as home screen).
const SPEC_STYLES: Record<string, { Icon: React.ComponentType<{ color: string; size: number }>; bg: string; color: string }> = {
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

const DEFAULT_STYLE = { Icon: Stethoscope, bg: '#EEF4FF', color: '#3B82F6' };

/** All specialities screen — shows full list from database. */
export function SpecialitiesScreen() {
  const navigation = useNavigation<PatientNav>();
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const { data, isLoading } = useSpecializations();
  const specializations = data?.specializations ?? [];

  const handlePress = (spec: string) => {
    // Navigate back to home with the specialization pre-selected
    // Using navigate to Tabs which resets to Home, then the home screen
    // will pick up the filter. For simplicity, go back and let home handle it.
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={specializations}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.heading}>
            All Specialities ({specializations.length})
          </Text>
        }
        renderItem={({ item }) => {
          const specStyle = SPEC_STYLES[item] ?? DEFAULT_STYLE;
          const SpecIcon = specStyle.Icon;
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => handlePress(item)}
            >
              <View style={[styles.iconWrap, { backgroundColor: specStyle.bg }]}>
                <SpecIcon color={specStyle.color} size={22} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.specName}>{item}</Text>
              </View>
              <ChevronRight color={c.textMuted} size={18} />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: spacing.md + 4, paddingBottom: 100 },
    heading: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      marginBottom: spacing.md,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.background,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.primary,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: { flex: 1 },
    specName: { fontSize: 15, fontWeight: '600', color: c.text },
  });
