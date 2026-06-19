import React from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CalendarX, Video, MapPin, PhoneCall, MessageSquare, Star } from 'lucide-react-native';
import { useAppointments, useCancelAppointment } from '../../hooks/use-appointments';
import { AppointmentStatusBadge } from '../../components/appointment-status-badge';
import type { PatientNav } from '../../navigation/types';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

/** Patient appointments list with status + cancel (Req 7, 18.6). */
export function PatientAppointmentsScreen() {
  const navigation = useNavigation<PatientNav>();
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const { data, isLoading } = useAppointments();
  const cancel = useCancelAppointment();

  const onCancel = (id: string) =>
    Alert.alert('Cancel appointment?', 'Refund applies if cancelled more than 2 hours before.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel it', style: 'destructive', onPress: () => cancel.mutate(id) },
    ]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>My Appointments</Text>
      {isLoading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <CalendarX color={c.textMuted} size={36} />
              <Text style={styles.empty}>No appointments yet. Find a doctor to book.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cancellable = item.status === 'CONFIRMED' || item.status === 'PENDING_PAYMENT';
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  {item.consultationType === 'VIDEO' ? (
                    <Video color={c.primary} size={18} />
                  ) : (
                    <MapPin color={c.accent} size={18} />
                  )}
                  <Text style={styles.doctor}>{item.doctor?.user?.name ?? 'Doctor'}</Text>
                  <AppointmentStatusBadge status={item.status} />
                </View>
                <Text style={styles.time}>{new Date(item.scheduledStart).toLocaleString()}</Text>
                <View style={styles.actions}>
                  {item.consultationType === 'VIDEO' &&
                    (item.status === 'CONFIRMED' || item.status === 'IN_PROGRESS') && (
                      <TouchableOpacity
                        style={styles.join}
                        onPress={() =>
                          navigation.navigate('VideoCall', {
                            appointmentId: item.id,
                            peerName: item.doctor?.user?.name ?? 'Doctor',
                          })
                        }
                      >
                        <PhoneCall color="#fff" size={14} />
                        <Text style={styles.joinText}>Join</Text>
                      </TouchableOpacity>
                    )}
                  {(item.status === 'CONFIRMED' || item.status === 'IN_PROGRESS') && (
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() =>
                        navigation.navigate('Chat', { appointmentId: item.id, peerName: item.doctor?.user?.name ?? 'Doctor' })
                      }
                    >
                      <MessageSquare color={c.primary} size={16} />
                      <Text style={styles.iconBtnText}>Message</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'COMPLETED' && (
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() =>
                        navigation.navigate('ReviewSubmit', { appointmentId: item.id, doctorName: item.doctor?.user?.name ?? 'Doctor' })
                      }
                    >
                      <Star color="#F5A623" size={16} />
                      <Text style={styles.iconBtnText}>Rate</Text>
                    </TouchableOpacity>
                  )}
                  {cancellable && (
                    <TouchableOpacity onPress={() => onCancel(item.id)}>
                      <Text style={styles.cancel}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  title: { ...typography.h1, color: c.text, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  list: { padding: spacing.md, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl },
  empty: { ...typography.body, color: c.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: c.background, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  doctor: { ...typography.h3, color: c.text, flex: 1 },
  time: { ...typography.body, color: c.textMuted, marginTop: spacing.xs },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  join: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.primary,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill,
  },
  joinText: { ...typography.caption, color: '#fff', fontWeight: '700' },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtnText: { ...typography.caption, color: c.primary, fontWeight: '600' },
  cancel: { ...typography.body, color: c.danger },
});
