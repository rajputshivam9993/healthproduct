import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Easing, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { CalendarX, Video, MapPin, PhoneCall, MessageSquare, Star, Clock, CalendarDays } from 'lucide-react-native';
import { useAppointments, useCancelAppointment } from '../../hooks/use-appointments';
import { AppointmentStatusBadge } from '../../components/appointment-status-badge';
import type { PatientNav } from '../../navigation/types';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

const { width: SCREEN_W } = Dimensions.get('window');
const WAVE_H = 46;

/** Small, looping pulse used to gently draw the eye to the screen title. */
function usePulse() {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value]);
  return value;
}

/** Initials for the doctor avatar fallback. */
function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

/** Patient appointments list with status + cancel (Req 7, 18.6). */
export function PatientAppointmentsScreen() {
  const navigation = useNavigation<PatientNav>();
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useAppointments();
  const cancel = useCancelAppointment();
  const pulse = usePulse();

  // Subtle scale + opacity breathing on the title dot.
  const dotScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const dotOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.25] });

  const count = data?.length ?? 0;

  const onCancel = (id: string) =>
    Alert.alert('Cancel appointment?', 'Refund applies if cancelled more than 2 hours before.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel it', style: 'destructive', onPress: () => cancel.mutate(id) },
    ]);

  return (
    <View style={styles.container}>
      {/* ─── Purple banner header ─── */}
      <View style={[styles.header, { paddingTop: insets.top + 22 }]}>
        <View style={styles.circleLg} pointerEvents="none" />
        <View style={styles.circleSm} pointerEvents="none" />
        <View style={styles.titleRow}>
          <View style={styles.dotWrap}>
            <Animated.View style={[styles.dotPulse, { transform: [{ scale: dotScale }], opacity: dotOpacity }]} />
            <View style={styles.dotCore} />
          </View>
          <Text style={styles.title}>My Appointments</Text>
        </View>
        {!isLoading && count > 0 && (
          <Text style={styles.subtitle}>
            {count} {count === 1 ? 'appointment' : 'appointments'}
          </Text>
        )}
        <View style={styles.waveWrap} pointerEvents="none">
          <Svg width={SCREEN_W} height={WAVE_H} viewBox={`0 0 ${SCREEN_W} ${WAVE_H}`}>
            <Path
              d={`M0,28 C ${SCREEN_W * 0.3},0 ${SCREEN_W * 0.7},${WAVE_H} ${SCREEN_W},14 L ${SCREEN_W},${WAVE_H} L 0,${WAVE_H} Z`}
              fill={c.surface}
            />
          </Svg>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIconWrap}>
                <CalendarX color={c.primary} size={34} />
              </View>
              <Text style={styles.emptyTitle}>No appointments yet</Text>
              <Text style={styles.empty}>Find a doctor to book your first consultation.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cancellable = item.status === 'CONFIRMED' || item.status === 'PENDING_PAYMENT';
            const name = item.doctor?.user?.name ?? 'Doctor';
            const isVideo = item.consultationType === 'VIDEO';
            const when = new Date(item.scheduledStart);
            const canJoin = isVideo && (item.status === 'CONFIRMED' || item.status === 'IN_PROGRESS');
            const canMessage = item.status === 'CONFIRMED' || item.status === 'IN_PROGRESS';
            const canRate = item.status === 'COMPLETED';
            const hasActions = canJoin || canMessage || canRate || cancellable;

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials(name) || 'Dr'}</Text>
                  </View>
                  <View style={styles.cardTopText}>
                    <Text style={styles.doctor} numberOfLines={1}>
                      {name}
                    </Text>
                    <View style={styles.typeRow}>
                      {isVideo ? <Video color={c.primary} size={13} /> : <MapPin color={c.accent} size={13} />}
                      <Text style={styles.typeText}>{isVideo ? 'Video consultation' : 'In-clinic visit'}</Text>
                    </View>
                  </View>
                  <AppointmentStatusBadge status={item.status} />
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <CalendarDays color={c.textMuted} size={14} />
                    <Text style={styles.metaText}>
                      {when.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock color={c.textMuted} size={14} />
                    <Text style={styles.metaText}>
                      {when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>

                {hasActions && (
                  <View style={styles.actions}>
                    {canJoin && (
                      <TouchableOpacity
                        style={styles.join}
                        activeOpacity={0.85}
                        onPress={() =>
                          navigation.navigate('VideoCall', { appointmentId: item.id, peerName: name })
                        }
                      >
                        <PhoneCall color="#fff" size={14} />
                        <Text style={styles.joinText}>Join</Text>
                      </TouchableOpacity>
                    )}
                    {canMessage && (
                      <TouchableOpacity
                        style={styles.outlineBtn}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Chat', { appointmentId: item.id, peerName: name })}
                      >
                        <MessageSquare color={c.primary} size={15} />
                        <Text style={styles.outlineBtnText}>Message</Text>
                      </TouchableOpacity>
                    )}
                    {canRate && (
                      <TouchableOpacity
                        style={styles.outlineBtn}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('ReviewSubmit', { appointmentId: item.id, doctorName: name })}
                      >
                        <Star color="#F5A623" size={15} fill="#F5A623" />
                        <Text style={styles.outlineBtnText}>Rate</Text>
                      </TouchableOpacity>
                    )}
                    {cancellable && (
                      <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={() => onCancel(item.id)}>
                        <Text style={styles.cancel}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface },

    // ─── Purple banner header ───
    header: {
      backgroundColor: c.primary,
      paddingHorizontal: spacing.md + 4,
      paddingBottom: WAVE_H + 14,
      overflow: 'hidden',
    },
    circleLg: { position: 'absolute', top: -50, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' },
    circleSm: { position: 'absolute', top: 20, left: -34, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.07)' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    dotWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
    dotPulse: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
    dotCore: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#fff' },
    title: { fontSize: 19, fontWeight: '700', color: '#fff' },
    subtitle: { ...typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs, marginLeft: 18 },
    waveWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },

    list: { padding: spacing.md, paddingBottom: 100, flexGrow: 1 },

    // ─── Empty state ───
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl },
    emptyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: c.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyTitle: { ...typography.h3, color: c.text },
    empty: { ...typography.body, color: c.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg },

    // ─── Card ───
    card: {
      backgroundColor: c.background,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.primary,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: c.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { ...typography.h3, color: c.primary, fontWeight: '700' },
    cardTopText: { flex: 1, gap: 3 },
    doctor: { ...typography.h3, color: c.text },
    typeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    typeText: { ...typography.caption, color: c.textMuted },

    // ─── Meta (date / time) ───
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { ...typography.caption, color: c.text, fontWeight: '600' },

    // ─── Actions ───
    actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
    join: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: c.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
    },
    joinText: { ...typography.caption, color: '#fff', fontWeight: '700' },
    outlineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    outlineBtnText: { ...typography.caption, color: c.primary, fontWeight: '700' },
    cancelBtn: { marginLeft: 'auto', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
    cancel: { ...typography.caption, color: c.danger, fontWeight: '700' },
  });
