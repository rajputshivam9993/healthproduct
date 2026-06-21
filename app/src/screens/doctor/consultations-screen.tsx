import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { CalendarClock, MapPin, Video } from 'lucide-react-native';
import { useAppointments } from '../../hooks/use-appointments';
import { AppointmentStatusBadge } from '../../components/appointment-status-badge';
import type { Appointment } from '../../services/appointment-service';
import type { DoctorNav } from '../../navigation/types';
import { radius, spacing, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

const { width: SCREEN_W } = Dimensions.get('window');
const WAVE_H = 44;
const SEG_PAD = 4;
const SEG_INNER = SCREEN_W - 2 * spacing.md - SEG_PAD * 2;
const SEG_HALF = SEG_INNER / 2;

type TabKey = 'upcoming' | 'past';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

/** Doctor consultations: upcoming/past tabs with Join for video (Req 21.5). */
export function DoctorConsultationsScreen() {
  const navigation = useNavigation<DoctorNav>();
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { data: appts, isLoading } = useAppointments();
  const [tab, setTab] = useState<TabKey>('upcoming');

  // header slide-down
  const headerY = useRef(new Animated.Value(-50)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerY, { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [headerY, headerOpacity]);

  const now = Date.now();
  const list = (appts ?? [])
    .filter((a) =>
      tab === 'upcoming'
        ? new Date(a.scheduledStart).getTime() >= now && a.status !== 'CANCELLED' && a.status !== 'COMPLETED'
        : new Date(a.scheduledStart).getTime() < now || a.status === 'COMPLETED' || a.status === 'CANCELLED',
    )
    .sort((a, b) =>
      tab === 'upcoming'
        ? new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
        : new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime(),
    );

  return (
    <View style={styles.container}>
      {/* ---------- Purple header ---------- */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 22, opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
        <View style={styles.circleLg} pointerEvents="none" />
        <View style={styles.circleSm} pointerEvents="none" />
        <Text style={styles.headerTitle}>Consultations</Text>
        <Text style={styles.headerSub}>{(appts ?? []).length} total appointments</Text>

        <View style={styles.waveWrap} pointerEvents="none">
          <Svg width={SCREEN_W} height={WAVE_H} viewBox={`0 0 ${SCREEN_W} ${WAVE_H}`}>
            <Path
              d={`M0,26 C ${SCREEN_W * 0.3},0 ${SCREEN_W * 0.7},${WAVE_H} ${SCREEN_W},12 L ${SCREEN_W},${WAVE_H} L 0,${WAVE_H} Z`}
              fill={c.surface}
            />
          </Svg>
        </View>
      </Animated.View>

      <View style={styles.body}>
        <ConsultTabs tab={tab} onChange={setTab} />

        {isLoading ? (
          <ActivityIndicator color={c.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <FlatList
            data={list}
            keyExtractor={(a) => a.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <CalendarClock color={c.textMuted} size={30} />
                </View>
                <Text style={styles.emptyText}>No {tab} consultations.</Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <ConsultationCard
                item={item}
                index={index}
                onPress={() => navigation.navigate('ConsultationDetail', { appointmentId: item.id })}
                onJoin={() =>
                  navigation.navigate('VideoCall', { appointmentId: item.id, peerName: item.patient?.name ?? 'Patient' })
                }
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

/** Sliding segmented control: a purple highlight springs between the two tabs. */
function ConsultTabs({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  const styles = useThemedStyles(makeStyles);
  const slide = useRef(new Animated.Value(tab === 'upcoming' ? 0 : 1)).current;
  useEffect(() => {
    Animated.spring(slide, { toValue: tab === 'upcoming' ? 0 : 1, friction: 9, tension: 90, useNativeDriver: true }).start();
  }, [tab, slide]);
  const tx = slide.interpolate({ inputRange: [0, 1], outputRange: [0, SEG_HALF] });
  return (
    <View style={styles.tabs}>
      <Animated.View style={[styles.tabHighlight, { transform: [{ translateX: tx }] }]} />
      {(['upcoming', 'past'] as const).map((key) => (
        <Pressable key={key} style={styles.tab} onPress={() => onChange(key)}>
          <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
            {key === 'upcoming' ? 'Upcoming' : 'Past'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Appointment card with a staggered entrance + press bounce. */
function ConsultationCard({
  item,
  index,
  onPress,
  onJoin,
}: {
  item: Appointment;
  index: number;
  onPress: () => void;
  onJoin: () => void;
}) {
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Cards fade + rise in, staggered by their position.
    Animated.timing(enter, {
      toValue: 1,
      duration: 360,
      delay: Math.min(index, 8) * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const isVideo = item.consultationType === 'VIDEO';
  const canJoin = isVideo && item.status === 'CONFIRMED';

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
          { scale: press },
        ],
      }}
    >
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={() => Animated.spring(press, { toValue: 0.98, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(press, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
      >
        <View style={styles.cardTop}>
          <View style={[styles.typeIcon, { backgroundColor: isVideo ? c.primaryMuted : '#E6F7F0' }]}>
            {isVideo ? <Video color={c.primary} size={15} /> : <MapPin color="#16A34A" size={15} />}
          </View>
          <View style={styles.flex}>
            <Text style={styles.name}>{item.patient?.name ?? 'Patient'}</Text>
            <Text style={styles.time}>{formatWhen(item.scheduledStart)}</Text>
          </View>
          <AppointmentStatusBadge status={item.status} />
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.typeTag}>
            {isVideo ? <Video color={c.textMuted} size={12} /> : <MapPin color={c.textMuted} size={12} />}
            <Text style={styles.typeTagText}>{isVideo ? 'Video consultation' : 'In-person visit'}</Text>
          </View>
          {canJoin && (
            <JoinButton onPress={onJoin} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function JoinButton({ onPress }: { onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.join, { transform: [{ scale }] }]}>
        <Video color="#fff" size={13} strokeWidth={2.4} />
        <Text style={styles.joinText}>Join</Text>
      </Animated.View>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface },
    flex: { flex: 1 },

    // header (purple with wave transition to the body)
    header: {
      backgroundColor: c.primary,
      paddingBottom: WAVE_H + 14,
      paddingHorizontal: spacing.md,
      overflow: 'hidden',
    },
    circleLg: { position: 'absolute', top: -45, right: -35, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)' },
    circleSm: { position: 'absolute', top: 30, left: -25, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.07)' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    headerSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
    waveWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },

    body: { flex: 1 },

    // tabs (sliding segment)
    tabs: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.primaryMuted,
      padding: SEG_PAD,
    },
    tabHighlight: {
      position: 'absolute',
      top: SEG_PAD,
      left: SEG_PAD,
      bottom: SEG_PAD,
      width: SEG_HALF,
      borderRadius: 18,
      backgroundColor: c.primary,
    },
    // zIndex keeps the labels above the highlight (Android paints elevated views on top).
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    tabText: { fontSize: 13.5, fontWeight: '600', color: c.textMuted },
    tabTextActive: { color: '#fff' },

    // list
    list: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.xl, flexGrow: 1 },
    empty: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl + spacing.lg, gap: spacing.md },
    emptyIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: c.primaryMuted, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 14, color: c.textMuted },

    // card
    card: {
      backgroundColor: c.background,
      borderRadius: radius.md,
      padding: spacing.sm + 2,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.primary,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    typeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    name: { fontSize: 13.5, fontWeight: '700', color: c.text },
    time: { fontSize: 11, color: c.textMuted, marginTop: 1 },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    typeTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    typeTagText: { fontSize: 10.5, color: c.textMuted },
    join: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.primary,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
    },
    joinText: { fontSize: 11.5, fontWeight: '700', color: '#fff' },
  });
