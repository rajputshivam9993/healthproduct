import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeCheck, LogOut, Pencil, Star, Stethoscope } from 'lucide-react-native';
import { useAuth } from '../../hooks/use-auth';
import { useMyDoctorProfile, useUpdateMyDoctorProfile } from '../../hooks/use-doctor-profile';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';
import { ThemeToggle } from '../../components/theme-toggle';

/** Doctor profile: view professional details + edit editable fields (Req 21.6, 4.2). */
export function DoctorProfileScreen() {
  const { logout } = useAuth();
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const { data: profile, isLoading } = useMyDoctorProfile();
  const update = useUpdateMyDoctorProfile();
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({ specialization: '', experienceYears: '', consultationFee: '', clinicAddress: '', bio: '' });

  const startEdit = () => {
    if (!profile) return;
    setForm({
      specialization: profile.specialization ?? '',
      experienceYears: String(profile.experienceYears ?? ''),
      consultationFee: profile.consultationFee ?? '',
      clinicAddress: profile.clinicAddress ?? '',
      bio: profile.bio ?? '',
    });
    setEditing(true);
  };

  const save = async () => {
    try {
      await update.mutateAsync({
        specialization: form.specialization || undefined,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined,
        clinicAddress: form.clinicAddress || undefined,
        bio: form.bio || undefined,
      });
      setEditing(false);
    } catch {
      Alert.alert('Update failed', 'Could not save your profile. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={c.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Stethoscope color={c.primary} size={28} />
          </View>
          <Text style={styles.name}>{profile?.user.name ?? 'Doctor'}</Text>
          <Text style={styles.spec}>{profile?.specialization ?? 'Specialization not set'}</Text>
          <View style={styles.badges}>
            {profile?.verificationStatus === 'VERIFIED' && (
              <View style={styles.verified}>
                <BadgeCheck color={c.success} size={16} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
            <View style={styles.rating}>
              <Star color="#F5A623" size={16} fill="#F5A623" />
              <Text style={styles.ratingText}>
                {profile?.avgRating ?? '0'} ({profile?.totalReviews ?? 0})
              </Text>
            </View>
          </View>
        </View>

        {editing ? (
          <View style={styles.card}>
            <EditField label="Specialization" value={form.specialization} onChange={(v) => setForm({ ...form, specialization: v })} />
            <EditField label="Experience (years)" value={form.experienceYears} keyboardType="number-pad" onChange={(v) => setForm({ ...form, experienceYears: v })} />
            <EditField label="Consultation fee (₹)" value={form.consultationFee} keyboardType="number-pad" onChange={(v) => setForm({ ...form, consultationFee: v })} />
            <EditField label="Clinic address" value={form.clinicAddress} onChange={(v) => setForm({ ...form, clinicAddress: v })} />
            <EditField label="Bio" value={form.bio} multiline onChange={(v) => setForm({ ...form, bio: v })} />
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={save} disabled={update.isPending}>
                {update.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Save</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setEditing(false)}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Detail label="Phone" value={profile?.user.phone} />
            <Detail label="Email" value={profile?.user.email ?? '—'} />
            <Detail label="Experience" value={`${profile?.experienceYears ?? 0} years`} />
            <Detail label="Consultation fee" value={profile?.consultationFee ? `₹${profile.consultationFee}` : '—'} />
            <Detail label="Qualification" value={profile?.qualification ?? '—'} />
            <Detail label="Clinic" value={profile?.clinicAddress ?? '—'} />
            <Detail label="Bio" value={profile?.bio ?? '—'} />
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={startEdit}>
              <Pencil color="#fff" size={16} />
              <Text style={styles.btnPrimaryText}>Edit profile</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.settingsLabel}>Appearance</Text>
        <ThemeToggle />

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <LogOut color={c.danger} size={18} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function EditField({
  label,
  value,
  onChange,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.detailLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface },
  settingsLabel: { ...typography.caption, color: c.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { alignItems: 'center', paddingVertical: spacing.lg },
  avatar: {
    width: 64, height: 64, borderRadius: radius.pill, backgroundColor: c.primaryMuted,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  name: { ...typography.h2, color: c.text },
  spec: { ...typography.body, color: c.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { ...typography.caption, color: c.success },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { ...typography.caption, color: c.textMuted },
  card: {
    backgroundColor: c.background, borderRadius: radius.lg, padding: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  detail: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border },
  detailLabel: { ...typography.caption, color: c.textMuted },
  detailValue: { ...typography.body, color: c.text, marginTop: 2 },
  field: { marginBottom: spacing.md },
  input: {
    ...typography.body, color: c.text, borderWidth: 1, borderColor: c.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: 4,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btn: { flexDirection: 'row', gap: spacing.xs, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  btnPrimary: { backgroundColor: c.primary, flex: 1 },
  btnPrimaryText: { ...typography.h3, color: '#fff' },
  btnGhost: { backgroundColor: c.surface, flex: 1 },
  btnGhostText: { ...typography.h3, color: c.textMuted },
  logout: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  logoutText: { ...typography.body, color: c.danger },
});
