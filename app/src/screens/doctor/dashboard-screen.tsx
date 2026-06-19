import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, IndianRupee, Stethoscope, TrendingUp } from 'lucide-react-native';
import { useAppointments } from '../../hooks/use-appointments';
import { useMyDoctorProfile } from '../../hooks/use-doctor-profile';
import type { Appointment } from '../../services/appointment-service';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

/** Doctor dashboard: today's count, next appointment, earnings summary (Req 21.3). */
export function DoctorDashboardScreen() {
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const { data: appts, isLoading } = useAppointments();
  const { data: profile } = useMyDoctorProfile();
  const fee = Number(profile?.consultationFee ?? 0);

  const stats = useMemo(() => computeStats(appts ?? [], fee), [appts, fee]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={c.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Hello, {profile?.user.name ?? 'Doctor'}</Text>

        <View style={styles.cardRow}>
          <StatCard icon={<CalendarDays color={c.primary} size={20} />} label="Today" value={`${stats.todayCount}`} />
          <StatCard icon={<TrendingUp color={c.accent} size={20} />} label="This week" value={`${stats.weekCount}`} />
        </View>

        <View style={styles.earnCard}>
          <View style={styles.earnHeader}>
            <IndianRupee color={c.success} size={18} />
            <Text style={styles.earnTitle}>Earnings</Text>
          </View>
          <View style={styles.earnRow}>
            <Earn label="Today" value={stats.earnToday} />
            <Earn label="This week" value={stats.earnWeek} />
            <Earn label="This month" value={stats.earnMonth} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Next appointment</Text>
        {stats.next ? (
          <View style={styles.nextCard}>
            <Stethoscope color={c.primary} size={22} />
            <View style={{ flex: 1 }}>
              <Text style={styles.nextName}>{stats.next.patient?.name ?? 'Patient'}</Text>
              <Text style={styles.nextMeta}>
                {new Date(stats.next.scheduledStart).toLocaleString()} · {stats.next.consultationType}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.empty}>No upcoming appointments.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
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

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.statCard}>
      {icon}
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

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface },
  content: { padding: spacing.md },
  greeting: { ...typography.h1, color: c.text, marginBottom: spacing.md },
  cardRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1, backgroundColor: c.background, borderRadius: radius.lg, padding: spacing.md, gap: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statValue: { ...typography.h1, color: c.text },
  statLabel: { ...typography.caption, color: c.textMuted },
  earnCard: {
    backgroundColor: c.background, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  earnHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  earnTitle: { ...typography.h3, color: c.text },
  earnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  earn: { alignItems: 'center', flex: 1 },
  earnValue: { ...typography.h3, color: c.success },
  sectionTitle: { ...typography.h3, color: c.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  nextCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: c.background,
    borderRadius: radius.lg, padding: spacing.md,
  },
  nextName: { ...typography.h3, color: c.text },
  nextMeta: { ...typography.caption, color: c.textMuted, marginTop: 2 },
  empty: { ...typography.body, color: c.textMuted },
});
