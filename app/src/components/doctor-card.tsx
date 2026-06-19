import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Clock, IndianRupee, MapPin, Star, Stethoscope } from 'lucide-react-native';
import type { DoctorSearchResult } from '../services/doctor-service';
import { radius, spacing, typography, type Palette } from '../theme';
import { usePalette, useThemedStyles } from '../theme/theme-context';

interface DoctorCardProps {
  doctor: DoctorSearchResult;
  onPress?: () => void;
}

/** Doctor listing card with rating, distance, fee, and availability (Req 18.5, 5.3). */
export function DoctorCard({ doctor, onPress }: DoctorCardProps) {
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const km = (doctor.distanceMeters / 1000).toFixed(1);
  const available = Boolean(doctor.nextAvailableSlot);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatar}>
        <Stethoscope color={c.primary} size={24} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {doctor.name ?? 'Doctor'}
          </Text>
          <View style={styles.ratingPill}>
            <Star color="#F5A623" size={13} fill="#F5A623" />
            <Text style={styles.ratingText}>{doctor.rating}</Text>
          </View>
        </View>
        <Text style={styles.spec}>{doctor.specialization ?? 'General Physician'}</Text>
        {(doctor.city || doctor.state) && (
          <View style={styles.meta}>
            <MapPin color={c.textMuted} size={13} />
            <Text style={styles.metaText}>
              {[doctor.city, doctor.state].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <MapPin color={c.textMuted} size={13} />
            <Text style={styles.metaText}>{km} km</Text>
          </View>
          <View style={styles.meta}>
            <IndianRupee color={c.textMuted} size={13} />
            <Text style={styles.metaText}>{doctor.consultationFee ?? '—'}</Text>
          </View>
          <Text style={styles.metaText}>{doctor.experienceYears} yrs exp</Text>
        </View>
        <View style={[styles.badge, available ? styles.badgeAvailable : styles.badgeBusy]}>
          <Clock color={available ? c.success : c.textMuted} size={12} />
          <Text style={[styles.badgeText, { color: available ? c.success : c.textMuted }]}>
            {available ? 'Available soon' : 'No slots in 7 days'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: c.background,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  avatar: {
    width: 52, height: 52, borderRadius: radius.md, backgroundColor: c.primaryMuted,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { ...typography.h3, color: c.text, flex: 1, marginRight: spacing.sm },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { ...typography.caption, color: c.text, fontWeight: '600' },
  spec: { ...typography.caption, color: c.primary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { ...typography.caption, color: c.textMuted },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    marginTop: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill,
  },
  badgeAvailable: { backgroundColor: '#E7F7F0' },
  badgeBusy: { backgroundColor: c.surface },
  badgeText: { ...typography.caption, fontWeight: '600' },
});
