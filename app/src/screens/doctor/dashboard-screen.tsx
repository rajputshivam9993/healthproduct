import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { CalendarClock, CalendarDays, IndianRupee, Stethoscope, TrendingUp } from 'lucide-react-native';
import { useAppointments } from '../../hooks/use-appointments';
import { useMyDoctorProfile } from '../../hooks/use-doctor-profile';
import type { Appointment } from '../../services/appointment-service';
import { radius, spacing, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

const { width: SCREEN_W } = Dimensions.get('window');
const WAVE_H = 44;

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

/** Doctor dashboard: today's count, next appointment, earnings summary (Req 21.3). */
export function DoctorDashboardScreen() {
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { data: appts, isLoading } = useAppointments();
  const { data: profile } = useMyDoctorProfile();
  const fee = Number(profile?.consultationFee ?? 0);

  const stats = useMemo(() => computeStats(appts ?? [], fee), [appts, fee]);

  // animations
  const headerY = useRef(new Animated.Value(-50)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;
  const stagger = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerY, { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarScale, { toValue: 1.06, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(avatarScale, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
    Animated.stagger(
      110,
      stagger.map((v) => Animated.spring(v, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true })),
    ).start();
  }, [headerY, headerOpacity, avatarScale, stagger]);

  const rise = (i: number) => ({
    opacity: stagger[i],
    transform: [
      { translateY: stagger[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
      { scale: stagger[i].interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={c.primary} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* ---------- Purple header ---------- */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 22, opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
        <View style={styles.circleLg} pointerEvents="none" />
        <View style={styles.circleSm} pointerEvents="none" />
        <View style={styles.headerRow}>
          <View style={styles.flex}>
            <Text style={styles.hello}>Hello,</Text>
            <Text style={styles.name} numberOfLines={1}>{profile?.user.name ?? 'Doctor'}</Text>
            <Text style={styles.headerSub}>{profile?.specialization ?? "Here's your day at a glance"}</Text>
          </View>
          <Animated.View style={[styles.avatar, { transform: [{ scale: avatarScale }] }]}>
            <Stethoscope color="#FFFFFF" size={26} strokeWidth={2.2} />
          </Animated.View>
        </View>

        <View style={styles.waveWrap} pointerEvents="none">
          <Svg width={SCREEN_W} height={WAVE_H} viewBox={`0 0 ${SCREEN_W} ${WAVE_H}`}>
            <Path
              d={`M0,26 C ${SCREEN_W * 0.3},0 ${SCREEN_W * 0.7},${WAVE_H} ${SCREEN_W},12 L ${SCREEN_W},${WAVE_H} L 0,${WAVE_H} Z`}
              fill={c.surface}
            />
          </Svg>
        </View>
      </Animated.View>

      <ScrollView style={styles.scrollFix} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stat cards */}
        <Animated.View style={[styles.cardRow, rise(0)]}>
          <StatCard
            icon={<CalendarDays color={c.primary} size={18} />}
            tint={c.primaryMuted}
            label="Today"
            value={`${stats.todayCount}`}
          />
          <StatCard
            icon={<TrendingUp color="#16A34A" size={18} />}
            tint="#E6F7F0"
            label="This week"
            value={`${stats.weekCount}`}
          />
        </Animated.View>

        {/* Earnings */}
        <Animated.View style={[styles.earnCard, rise(1)]}>
          <View style={styles.earnHeader}>
            <View style={[styles.earnIcon, { backgroundColor: '#E6F7F0' }]}>
              <IndianRupee color="#16A34A" size={16} />
            </View>
            <Text style={styles.earnTitle}>Earnings</Text>
          </View>
          <View style={styles.earnRow}>
            <Earn label="Today" value={stats.earnToday} />
            <View style={styles.earnDivider} />
            <Earn label="This week" value={stats.earnWeek} />
            <View style={styles.earnDivider} />
            <Earn label="This month" value={stats.earnMonth} />
          </View>
        </Animated.View>

        {/* Next appointment */}
        <Animated.View style={rise(2)}>
          <Text style={styles.sectionTitle}>Next appointment</Text>
          {stats.next ? (
            <View style={styles.nextCard}>
              <View style={styles.nextIcon}>
                <Stethoscope color={c.primary} size={20} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.nextName}>{stats.next.patient?.name ?? 'Patient'}</Text>
                <Text style={styles.nextMeta}>
                  {formatWhen(stats.next.scheduledStart)} · {stats.next.consultationType === 'VIDEO' ? 'Video' : 'In-person'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <CalendarClock color={c.textMuted} size={26} />
              </View>
              <Text style={styles.empty}>No upcoming appointments.</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function computeStats(appts: Appointment[], fee: number) {
  const now = Date.now();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = now - 7 * 86400000;
  const monthAgo = now - 30 * 86400000;
  const isCompleted = (a: Appointment) => a.status === 'COMPLETED';
  const ts = (a: Appointment) => new Date(a.scheduledStart).getTime();

  const todayCount = appts.filter((a) => ts(a) >= startOfToday.getTime() && ts(a) < startOfToday.getTime() + 86400000).length;
  const weekCount = appts.filter((a) => ts(a) >= weekAgo).length;
  const completedSince = (since: number) => appts.filter((a) => isCompleted(a) && ts(a) >= since).length * fee;

  const upcoming = appts
    .filter((a) => (a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS') && ts(a) >= now)
    .sort((a, b) => ts(a) - ts(b));

  return {
    todayCount,
    weekCount,
    earnToday: completedSince(startOfToday.getTime()),
    earnWeek: completedSince(weekAgo),
    earnMonth: completedSince(monthAgo),
    next: upcoming[0] ?? null,
  };
}

function StatCard({ icon, tint, label, value }: { icon: React.ReactNode; tint: string; label: string; value: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Earn({ label, value }: { label: string; value: number }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.earn}>
      <Text style={styles.earnValue}>₹{value.toLocaleString('en-IN')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface },
    flex: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface },

    // header
    header: { backgroundColor: c.primary, paddingBottom: WAVE_H + 14, paddingHorizontal: spacing.md, overflow: 'hidden' },
    circleLg: { position: 'absolute', top: -45, right: -35, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)' },
    circleSm: { position: 'absolute', top: 30, left: -25, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.07)' },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    hello: { fontSize: 13, color: 'rgba(255,255,255,0.78)' },
    name: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 1 },
    headerSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.72)', marginTop: 3 },
    avatar: {
      width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    },
    waveWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    // Pull the body up by 1px with a surface backing so no thin purple seam shows
    // between the wave's bottom and the content (keeps the wave design intact).
    scrollFix: { marginTop: -1, backgroundColor: c.surface },

    // content
    content: { padding: spacing.md, paddingBottom: spacing.xl },

    // stat cards
    cardRow: { flexDirection: 'row', gap: spacing.md },
    statCard: {
      flex: 1, backgroundColor: c.background, borderRadius: radius.lg, padding: spacing.md, gap: 6,
      borderWidth: 1, borderColor: c.border,
      shadowColor: c.primary, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
    },
    statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: 24, fontWeight: '800', color: c.text },
    statLabel: { fontSize: 12, color: c.textMuted },

    // earnings
    earnCard: {
      backgroundColor: c.background, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md,
      borderWidth: 1, borderColor: c.border,
      shadowColor: c.primary, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
    },
    earnHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    earnIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    earnTitle: { fontSize: 15, fontWeight: '700', color: c.text },
    earnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    earnDivider: { width: 1, height: 34, backgroundColor: c.border },
    earn: { alignItems: 'center', flex: 1 },
    earnValue: { fontSize: 16, fontWeight: '800', color: '#16A34A' },

    // next appointment
    sectionTitle: { fontSize: 15, fontWeight: '700', color: c.text, marginTop: spacing.lg, marginBottom: spacing.sm },
    nextCard: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: c.background,
      borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: c.border,
      shadowColor: c.primary, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
    },
    nextIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primaryMuted, alignItems: 'center', justifyContent: 'center' },
    nextName: { fontSize: 15, fontWeight: '700', color: c.text },
    nextMeta: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    emptyCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, backgroundColor: c.background, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border },
    emptyIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: c.primaryMuted, alignItems: 'center', justifyContent: 'center' },
    empty: { fontSize: 13.5, color: c.textMuted },
  });
