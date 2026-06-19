import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronRight, FileText, LogOut, Pencil, User } from 'lucide-react-native';
import { useAuth } from '../../hooks/use-auth';
import { usePatientProfile, useUpdatePatientProfile, useUploadAvatar } from '../../hooks/use-patient-profile';
import { config } from '../../constants/config';
import type { PatientNav } from '../../navigation/types';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';
import { ThemeToggle } from '../../components/theme-toggle';

const mediaBase = config.apiBaseUrl.replace('/api', '');

/** Patient profile: view + edit personal/medical details, prescriptions link (Req 4.1). */
export function PatientProfileScreen() {
  const navigation = useNavigation<PatientNav>();
  const { logout } = useAuth();
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const { data: profile, isLoading } = usePatientProfile();
  const update = useUpdatePatientProfile();
  const uploadAvatar = useUploadAvatar();
  const [editing, setEditing] = useState(false);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to set an avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      try {
        await uploadAvatar.mutateAsync(result.assets[0].uri);
      } catch {
        Alert.alert('Upload failed', 'Could not upload the image.');
      }
    }
  };
  const [form, setForm] = useState({ name: '', dateOfBirth: '', gender: '', bloodGroup: '', allergies: '' });

  const startEdit = () => {
    if (!profile) return;
    setForm({
      name: profile.name ?? '',
      dateOfBirth: profile.dateOfBirth ?? '',
      gender: profile.gender ?? '',
      bloodGroup: profile.bloodGroup ?? '',
      allergies: profile.allergies ?? '',
    });
    setEditing(true);
  };

  const save = async () => {
    try {
      await update.mutateAsync({
        name: form.name || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        allergies: form.allergies || undefined,
      });
      setEditing(false);
    } catch {
      Alert.alert('Update failed', 'Please check your inputs and try again.');
    }
  };

  if (isLoading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color={c.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: `${mediaBase}${profile.avatarUrl}` }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}><User color={c.primary} size={28} /></View>
            )}
            <View style={styles.cameraBadge}>
              {uploadAvatar.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Camera color="#fff" size={14} />}
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{profile?.name ?? 'Patient'}</Text>
          <Text style={styles.phone}>{profile?.phone}</Text>
        </View>

        {editing ? (
          <View style={styles.card}>
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Date of birth (YYYY-MM-DD)" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
            <Field label="Gender (MALE/FEMALE/OTHER)" value={form.gender} onChange={(v) => setForm({ ...form, gender: v.toUpperCase() })} />
            <Field label="Blood group" value={form.bloodGroup} onChange={(v) => setForm({ ...form, bloodGroup: v })} />
            <Field label="Allergies" value={form.allergies} onChange={(v) => setForm({ ...form, allergies: v })} multiline />
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
            <Detail label="Email" value={profile?.email ?? '—'} />
            <Detail label="Date of birth" value={profile?.dateOfBirth ?? '—'} />
            <Detail label="Gender" value={profile?.gender ?? '—'} />
            <Detail label="Blood group" value={profile?.bloodGroup ?? '—'} />
            <Detail label="Allergies" value={profile?.allergies ?? '—'} />
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={startEdit}>
              <Pencil color="#fff" size={16} />
              <Text style={styles.btnPrimaryText}>Edit profile</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Prescriptions')}>
          <FileText color={c.primary} size={20} />
          <Text style={styles.linkText}>My Prescriptions</Text>
          <ChevronRight color={c.textMuted} size={18} />
        </TouchableOpacity>

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

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.detailLabel}>{label}</Text>
      <TextInput style={[styles.input, multiline && styles.inputMultiline]} value={value} onChangeText={onChange} multiline={multiline} />
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface },
  settingsLabel: { ...typography.caption, color: c.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm },
  content: { padding: spacing.md },
  header: { alignItems: 'center', paddingVertical: spacing.lg },
  avatarWrap: { marginBottom: spacing.sm },
  avatar: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: c.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 72, height: 72, borderRadius: radius.pill },
  cameraBadge: { position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: radius.pill, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.surface },
  name: { ...typography.h2, color: c.text },
  phone: { ...typography.body, color: c.textMuted, marginTop: 2 },
  card: { backgroundColor: c.background, borderRadius: radius.lg, padding: spacing.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  detail: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border },
  detailLabel: { ...typography.caption, color: c.textMuted },
  detailValue: { ...typography.body, color: c.text, marginTop: 2 },
  field: { marginBottom: spacing.md },
  input: { ...typography.body, color: c.text, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: 4 },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btn: { flexDirection: 'row', gap: spacing.xs, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  btnPrimary: { backgroundColor: c.primary, flex: 1 },
  btnPrimaryText: { ...typography.h3, color: '#fff' },
  btnGhost: { backgroundColor: c.surface, flex: 1 },
  btnGhostText: { ...typography.h3, color: c.textMuted },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: c.background, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
  linkText: { ...typography.body, color: c.text, flex: 1 },
  logout: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  logoutText: { ...typography.body, color: c.danger },
});
