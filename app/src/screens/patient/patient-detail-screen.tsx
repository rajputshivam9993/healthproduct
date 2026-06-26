import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, User, UserPlus } from 'lucide-react-native';
import { usePatientDetails, useCreatePatientDetail } from '../../hooks/use-patient-details';
import { useBookAndPay } from '../../hooks/use-appointments';
import type { PatientStackParamList, PatientNav } from '../../navigation/types';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

type ScreenRoute = RouteProp<PatientStackParamList, 'PatientDetail'>;

/** Patient detail selection/creation screen — shown after slot selection, before payment. */
export function PatientDetailScreen() {
  const route = useRoute<ScreenRoute>();
  const navigation = useNavigation<PatientNav>();
  const { slotId } = route.params;
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);

  const { data: patients, isLoading } = usePatientDetails();
  const createPatient = useCreatePatientDetail();
  const bookAndPay = useBookAndPay();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | null>(null);

  const handleAddNew = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter the patient name.');
      return;
    }
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
      Alert.alert('Validation', 'Please enter a valid age (0-150).');
      return;
    }
    if (!gender) {
      Alert.alert('Validation', 'Please select a gender.');
      return;
    }
    try {
      const created = await createPatient.mutateAsync({ name: name.trim(), age: parsedAge, gender });
      setSelectedId(created.id);
      setShowForm(false);
      setName('');
      setAge('');
      setGender(null);
    } catch {
      Alert.alert('Error', 'Could not save patient details. Try again.');
    }
  };

  const handleProceed = async () => {
    if (!selectedId) {
      Alert.alert('Select Patient', 'Please select a patient or add a new one.');
      return;
    }
    try {
      await bookAndPay.mutateAsync({ slotId, patientDetailId: selectedId });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Booked!', 'Your appointment is confirmed.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Tabs', { screen: 'Appointments' } as any),
        },
      ]);
    } catch (err) {
      Alert.alert('Booking failed', extractError(err));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['bottom']}>
        <ActivityIndicator color={c.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.heading}>Who is this appointment for?</Text>
          <Text style={styles.subheading}>
            Select an existing patient or add a new one.
          </Text>

          {/* Existing patients list */}
          {patients && patients.length > 0 && (
            <View style={styles.listSection}>
              {patients.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.patientCard, selectedId === p.id && styles.patientCardActive]}
                  onPress={() => { setSelectedId(p.id); setShowForm(false); }}
                >
                  <User color={selectedId === p.id ? '#fff' : c.primary} size={20} />
                  <View style={styles.patientInfo}>
                    <Text style={[styles.patientName, selectedId === p.id && styles.patientNameActive]}>
                      {p.name}
                    </Text>
                    <Text style={[styles.patientMeta, selectedId === p.id && styles.patientMetaActive]}>
                      {p.age} yrs · {p.gender}
                    </Text>
                  </View>
                  {selectedId === p.id && <CheckCircle2 color="#fff" size={20} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Add new patient button */}
          {!showForm && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => { setShowForm(true); setSelectedId(null); }}
            >
              <UserPlus color={c.primary} size={20} />
              <Text style={styles.addButtonText}>Add New Patient</Text>
            </TouchableOpacity>
          )}

          {/* New patient form */}
          {showForm && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>New Patient Details</Text>

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Patient full name"
                placeholderTextColor={c.textMuted}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Age in years"
                placeholderTextColor={c.textMuted}
                keyboardType="numeric"
                maxLength={3}
              />

              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, gender === g && styles.genderChipActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, createPatient.isPending && styles.saveButtonDisabled]}
                  onPress={handleAddNew}
                  disabled={createPatient.isPending}
                >
                  {createPatient.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Patient</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, (!selectedId || bookAndPay.isPending) && styles.ctaDisabled]}
            onPress={handleProceed}
            disabled={!selectedId || bookAndPay.isPending}
          >
            {bookAndPay.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Proceed to Pay</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function extractError(err: unknown): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Try again.';
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: spacing.md, paddingBottom: 120 },
    heading: { ...typography.h2, color: c.text, marginBottom: spacing.xs },
    subheading: { ...typography.body, color: c.textMuted, marginBottom: spacing.lg },
    listSection: { gap: spacing.sm, marginBottom: spacing.md },
    patientCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.background,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    patientCardActive: { backgroundColor: c.primary, borderColor: c.primary },
    patientInfo: { flex: 1 },
    patientName: { ...typography.body, color: c.text, fontWeight: '600' },
    patientNameActive: { color: '#fff' },
    patientMeta: { ...typography.caption, color: c.textMuted, marginTop: 2 },
    patientMetaActive: { color: 'rgba(255,255,255,0.8)' },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.primary,
      borderStyle: 'dashed',
      marginBottom: spacing.md,
    },
    addButtonText: { ...typography.body, color: c.primary, fontWeight: '600' },
    form: {
      backgroundColor: c.background,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    formTitle: { ...typography.h3, color: c.text, marginBottom: spacing.md },
    label: { ...typography.caption, color: c.textMuted, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.sm },
    input: {
      backgroundColor: c.surface,
      borderRadius: radius.sm,
      padding: spacing.sm + 4,
      borderWidth: 1,
      borderColor: c.border,
      color: c.text,
      ...typography.body,
    },
    genderRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    genderChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    genderChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    genderText: { ...typography.caption, color: c.text, fontWeight: '600' },
    genderTextActive: { color: '#fff' },
    formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    cancelButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm + 4,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    cancelButtonText: { ...typography.body, color: c.textMuted, fontWeight: '600' },
    saveButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm + 4,
      borderRadius: radius.sm,
      backgroundColor: c.primary,
    },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { ...typography.body, color: '#fff', fontWeight: '600' },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: spacing.md,
      backgroundColor: c.background,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    cta: { backgroundColor: c.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
    ctaDisabled: { opacity: 0.5 },
    ctaText: { ...typography.h3, color: '#fff' },
  });
