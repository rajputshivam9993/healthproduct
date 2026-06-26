import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock, IndianRupee, MapPin, Star, Stethoscope } from 'lucide-react-native';
import type { DoctorSearchResult } from '../services/doctor-service';
import { radius, spacing, type Palette } from '../theme';
import { usePalette, useThemedStyles } from '../theme/theme-context';

interface DoctorCardProps {
  doctor: DoctorSearchResult;
  onPress?: () => void;
}

/** Doctor listing card with rating, distance, fee, and availability (Req 18.5, 5.3). */
export function DoctorCard({ doctor, onPress }: DoctorCardProps) {
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const scale = useRef(new Animated.Value(1)).current; // press bounce
  const km = (doctor.distanceMeters / 1000).toFixed(1);
  const available = Boolean(doctor.nextAvailableSlot);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={styles.avatar}>
          <Stethoscope color={c.primary} size={24} />
          {available && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>{doctor.name ?? 'Doctor'}</Text>
            <View style={styles.ratingPill}>
              <Star color="#F5A623" size={12} fill="#F5A623" />
              <Text style={styles.ratingText}>{doctor.rating}</Text>
            </View>
          </View>

          <Text style={styles.spec}>{doctor.specialization ?? 'General Physician'}</Text>

          {(doctor.city || doctor.state) && (
            <View style={styles.locRow}>
              <MapPin color={c.textMuted} size={12} />
              <Text style={styles.locText} numberOfLines={1}>
                {[doctor.city, doctor.state].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <MapPin color={c.primary} size={11} />
              <Text style={styles.chipText}>{km} km</Text>
            </View>
            <View style={styles.chip}>
              <IndianRupee color={c.primary} size={11} />
              <Text style={styles.chipText}>{doctor.consultationFee ?? '—'}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{doctor.experienceYears} yrs exp</Text>
            </View>
          </View>

          <View style={[styles.badge, available ? styles.badgeAvailable : styles.badgeBusy]}>
            <Clock color={available ? c.success : c.textMuted} size={12} />
            <Text style={[styles.badgeText, { color: available ? c.success : c.textMuted }]}>
              {available ? 'Available soon' : 'No slots in 7 days'}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.background,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.primary,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    avatar: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: c.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginRight: spacing.md,
    },
    onlineDot: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 13,
      height: 13,
      borderRadius: 7,
      backgroundColor: c.success,
      borderWidth: 2,
      borderColor: c.background,
    },
    body: { flex: 1 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    name: { fontSize: 15, fontWeight: '700', color: c.text, flex: 1, marginRight: spacing.sm },
    ratingPill: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: '#FFF6E6', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999,
    },
    ratingText: { fontSize: 12, color: '#B8860B', fontWeight: '700' },
    spec: { fontSize: 12, color: c.primary, fontWeight: '600', marginTop: 2 },
    locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    locText: { fontSize: 11.5, color: c.textMuted, flex: 1 },
    chipsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: c.primaryMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    chipText: { fontSize: 11, color: c.text, fontWeight: '600' },
    badge: {
      flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
      marginTop: 8, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999,
    },
    badgeAvailable: { backgroundColor: '#E7F7F0' },
    badgeBusy: { backgroundColor: c.surface },
    badgeText: { fontSize: 11.5, fontWeight: '700' },
  });
