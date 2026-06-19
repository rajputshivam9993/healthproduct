import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppointmentStatus } from '../services/appointment-service';
import { radius, spacing, typography } from '../theme';

// Color-coded appointment status pill (Req 18.6).
const COLORS: Record<AppointmentStatus, { bg: string; fg: string }> = {
  PENDING_PAYMENT: { bg: '#FEF3E7', fg: '#C77700' },
  CONFIRMED: { bg: '#E7F0FE', fg: '#1E6FE8' },
  IN_PROGRESS: { bg: '#EAF7F1', fg: '#0E8A57' },
  COMPLETED: { bg: '#E7F7F0', fg: '#20B486' },
  CANCELLED: { bg: '#FDEDED', fg: '#E5484D' },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const c = COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  text: { ...typography.caption, fontWeight: '700' },
});
