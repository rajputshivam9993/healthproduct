import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { CheckCircle2, MessageSquare, Plus, Video, X } from 'lucide-react-native';
import { useAppointment, useCompleteConsultation, useCreatePrescription } from '../../hooks/use-consultation';
import { useCancelAppointment } from '../../hooks/use-appointments';
import { AppointmentStatusBadge } from '../../components/appointment-status-badge';
import type { DoctorNav, DoctorStackParamList } from '../../navigation/types';
import type { Medication } from '../../services/prescription-service';
import { lightPalette, radius, spacing, typography } from '../../theme';

type DetailRoute = RouteProp<DoctorStackParamList, 'ConsultationDetail'>;
const emptyMed: Medication = { name: '', dosage: '', frequency: '', duration: '' };

/** Doctor consultation detail: patient info, actions, and prescription writing (Req 21.7, 10). */
export function ConsultationDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<DoctorNav>();
  const { appointmentId } = route.params;
  const { data: appt, isLoading } = useAppointment(appointmentId);
  const complete = useCompleteConsultation();
  const cancel = useCancelAppointment();
  const createRx = useCreatePrescription();

  const [meds, setMeds] = useState<Medication[]>([{ ...emptyMed }]);
  const [notes, setNotes] = useState('');

  if (isLoading || !appt) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={lightPalette.primary} />
      </SafeAreaView>
    );
  }

  const updateMed = (i: number, key: keyof Medication, val: string) =>
    setMeds((m) => m.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));

  const savePrescription = async () => {
    const valid = meds.filter((m) => m.name && m.dosage && m.frequency && m.duration);
    if (valid.length === 0) {
      Alert.alert('Add medication', 'Fill at least one complete medication row.');
      return;
    }
    try {
      await createRx.mutateAsync({ appointmentId, medications: valid, notes: notes || undefined });
      Alert.alert('Saved', 'Prescription created.');
      setMeds([{ ...emptyMed }]);
      setNotes('');
    } catch (err) {
      Alert.alert('Failed', extractError(err));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{appt.patient?.name ?? 'Patient'}</Text>
          <AppointmentStatusBadge status={appt.status} />
        </View>
        <Text style={styles.meta}>{new Date(appt.scheduledStart).toLocaleString()} · {appt.consultationType}</Text>

        <View style={styles.actions}>
          {appt.consultationType === 'VIDEO' && (appt.status === 'CONFIRMED' || appt.status === 'IN_PROGRESS') && (
            <Action icon={<Video color="#fff" size={18} />} label="Join Video" onPress={() => navigation.navigate('VideoCall', { appointmentId, peerName: appt.patient?.name ?? 'Patient' })} />
          )}
          <Action icon={<MessageSquare color="#fff" size={18} />} label="Message" tone="accent" onPress={() => navigation.navigate('Chat', { appointmentId, peerName: appt.patient?.name ?? 'Patient' })} />
          {appt.status === 'IN_PROGRESS' && (
            <Action icon={<CheckCircle2 color="#fff" size={18} />} label="Complete" tone="success" onPress={() => complete.mutate(appointmentId)} />
          )}
          {(appt.status === 'CONFIRMED' || appt.status === 'PENDING_PAYMENT') && (
            <Action icon={<X color="#fff" size={18} />} label="Cancel" tone="danger" onPress={() => cancel.mutate(appointmentId)} />
          )}
        </View>

        {appt.status === 'COMPLETED' && (
          <View style={styles.rxCard}>
            <Text style={styles.sectionTitle}>Write prescription</Text>
            {meds.map((m, i) => (
              <View key={i} style={styles.medRow}>
                <TextInput style={[styles.input, styles.flex2]} placeholder="Medicine" placeholderTextColor={lightPalette.textMuted} value={m.name} onChangeText={(v) => updateMed(i, 'name', v)} />
                <TextInput style={styles.input} placeholder="Dosage" placeholderTextColor={lightPalette.textMuted} value={m.dosage} onChangeText={(v) => updateMed(i, 'dosage', v)} />
                <TextInput style={styles.input} placeholder="Freq" placeholderTextColor={lightPalette.textMuted} value={m.frequency} onChangeText={(v) => updateMed(i, 'frequency', v)} />
                <TextInput style={styles.input} placeholder="Days" placeholderTextColor={lightPalette.textMuted} value={m.duration} onChangeText={(v) => updateMed(i, 'duration', v)} />
              </View>
            ))}
            <TouchableOpacity style={styles.addMed} onPress={() => setMeds((m) => [...m, { ...emptyMed }])}>
              <Plus color={lightPalette.primary} size={16} />
              <Text style={styles.addMedText}>Add medicine</Text>
            </TouchableOpacity>
            <TextInput style={[styles.input, styles.notes]} placeholder="Notes (optional)" placeholderTextColor={lightPalette.textMuted} value={notes} onChangeText={setNotes} multiline />
            <TouchableOpacity style={styles.saveBtn} onPress={savePrescription} disabled={createRx.isPending}>
              {createRx.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save prescription</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ icon, label, onPress, tone = 'primary' }: { icon: React.ReactNode; label: string; onPress: () => void; tone?: 'primary' | 'success' | 'danger' | 'accent' }) {
  const bg = { primary: lightPalette.primary, success: lightPalette.success, danger: lightPalette.danger, accent: lightPalette.accent }[tone];
  return (
    <TouchableOpacity style={[styles.action, { backgroundColor: bg }]} onPress={onPress}>
      {icon}
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function extractError(err: unknown): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Try again.';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: lightPalette.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: lightPalette.surface },
  content: { padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { ...typography.h1, color: lightPalette.text },
  meta: { ...typography.body, color: lightPalette.textMuted, marginTop: spacing.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  actionText: { ...typography.body, color: '#fff', fontWeight: '600' },
  rxCard: { backgroundColor: lightPalette.background, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg },
  sectionTitle: { ...typography.h3, color: lightPalette.text, marginBottom: spacing.sm },
  medRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  input: { flex: 1, ...typography.caption, color: lightPalette.text, borderWidth: 1, borderColor: lightPalette.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  flex2: { flex: 2 },
  notes: { marginTop: spacing.sm, minHeight: 60, textAlignVertical: 'top' },
  addMed: { flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: spacing.sm },
  addMedText: { ...typography.caption, color: lightPalette.primary },
  saveBtn: { backgroundColor: lightPalette.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  saveText: { ...typography.h3, color: '#fff' },
});
