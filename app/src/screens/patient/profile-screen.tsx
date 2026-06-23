import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  Cake,
  Camera,
  ChevronRight,
  Droplet,
  FileText,
  LogOut,
  Mail,
  Pencil,
  Phone,
  ShieldAlert,
  User,
  VenusAndMars,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/use-auth';
import { usePatientProfile, useUpdatePatientProfile, useUploadAvatar } from '../../hooks/use-patient-profile';
import { config } from '../../constants/config';
import type { PatientNav } from '../../navigation/types';
import { radius, spacing, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';
import { ThemeToggle } from '../../components/theme-toggle';

const { width: SCREEN_W } = Dimensions.get('window');
const WAVE_H = 46;
const mediaBase = config.apiBaseUrl.replace('/api', '');

/** Compute whole-year age from a YYYY-MM-DD date string. */
function ageFromDob(dob?: string): string {
  if (!dob) return '—';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return '—';
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 150 ? String(age) : '—';
}

/** Patient profile: view + edit personal/medical details, prescriptions link (Req 4.1). */
export function PatientProfileScreen() {
  const navigation = useNavigation<PatientNav>();
  const { logout } = useAuth();
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = usePatientProfile();
  const update = useUpdatePatientProfile();
  const uploadAvatar = useUploadAvatar();
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({ name: '', dateOfBirth: '', gender: '', bloodGroup: '', allergies: '' });

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

  // --- animations (mirror the doctor profile) ---
  const headerY = useRef(new Animated.Value(-60)).current; // header slide-down
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(1)).current; // avatar pulse loop
  const stagger = useRef([0, 1, 2].map(() => new Animated.Value(0))).current; // staggered cards

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Avatar breathes 1.0 -> 1.06 -> 1.0 on a ~3s loop.
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarScale, { toValue: 1.06, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(avatarScale, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    // Cards pop in one after another.
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
    return (
      <View style={styles.center}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ---------- Purple header ---------- */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 28, opacity: headerOpacity, transform: [{ translateY: headerY }] }]}
      >
        <Animated.View style={[styles.circleLg]} pointerEvents="none" />
        <Animated.View style={[styles.circleSm]} pointerEvents="none" />

        <Pressable onPress={pickAvatar}>
          <Animated.View style={[styles.avatar, { transform: [{ scale: avatarScale }] }]}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: `${mediaBase}${profile.avatarUrl}` }} style={styles.avatarImg} />
            ) : (
              <User color="#FFFFFF" size={30} strokeWidth={2.2} />
            )}
            <View style={styles.cameraBadge}>
              {uploadAvatar.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Camera color="#fff" size={13} />}
            </View>
          </Animated.View>
        </Pressable>
        <Text style={styles.name}>{profile?.name ?? 'Patient'}</Text>
        <Text style={styles.spec}>{profile?.phone ?? 'Phone not set'}</Text>

        <View style={styles.badges}>
          {profile?.bloodGroup ? (
            <View style={styles.badgeChip}>
              <Droplet color="#FFD479" size={14} fill="#FFD479" />
              <Text style={styles.badgeChipText}>{profile.bloodGroup}</Text>
            </View>
          ) : null}
          {profile?.gender ? (
            <View style={styles.badgeChip}>
              <VenusAndMars color="#FFFFFF" size={14} />
              <Text style={styles.badgeChipText}>{profile.gender}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.waveWrap} pointerEvents="none">
          <Svg width={SCREEN_W} height={WAVE_H} viewBox={`0 0 ${SCREEN_W} ${WAVE_H}`}>
            <Path
              d={`M0,28 C ${SCREEN_W * 0.3},0 ${SCREEN_W * 0.7},${WAVE_H} ${SCREEN_W},14 L ${SCREEN_W},${WAVE_H} L 0,${WAVE_H} Z`}
              fill={c.surface}
            />
          </Svg>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!editing && (
          <Animated.View style={[styles.statRow, rise(0)]}>
            <StatCard icon={<Cake color={c.primary} size={18} />} value={ageFromDob(profile?.dateOfBirth ?? undefined)} label="Years old" />
            <StatCard icon={<Droplet color={c.primary} size={18} />} value={profile?.bloodGroup ?? '—'} label="Blood group" />
            <StatCard icon={<VenusAndMars color={c.primary} size={18} />} value={profile?.gender ?? '—'} label="Gender" />
          </Animated.View>
        )}

        {editing ? (
          <View style={styles.card}>
            <EditField label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <EditField label="Date of birth (YYYY-MM-DD)" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
            <EditField label="Gender (MALE/FEMALE/OTHER)" value={form.gender} onChange={(v) => setForm({ ...form, gender: v.toUpperCase() })} />
            <EditField label="Blood group" value={form.bloodGroup} onChange={(v) => setForm({ ...form, bloodGroup: v })} />
            <EditField label="Allergies" value={form.allergies} multiline onChange={(v) => setForm({ ...form, allergies: v })} />
            <View style={styles.row}>
              <CtaButton style={styles.btnPrimary} onPress={save} disabled={update.isPending}>
                {update.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Save</Text>}
              </CtaButton>
              <CtaButton style={styles.btnGhost} onPress={() => setEditing(false)}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </CtaButton>
            </View>
          </View>
        ) : (
          <Animated.View style={[styles.card, rise(1)]}>
            <DetailRow icon={<Phone color={c.primary} size={16} />} label="Phone" value={profile?.phone ?? '—'} />
            <DetailRow icon={<Mail color={c.primary} size={16} />} label="Email" value={profile?.email ?? '—'} />
            <DetailRow icon={<Cake color={c.primary} size={16} />} label="Date of birth" value={profile?.dateOfBirth ?? '—'} />
            <DetailRow icon={<ShieldAlert color={c.primary} size={16} />} label="Allergies" value={profile?.allergies ?? '—'} last />

            <CtaButton style={styles.btnPrimary} onPress={startEdit}>
              <Pencil color="#fff" size={16} />
              <Text style={styles.btnPrimaryText}>Edit profile</Text>
            </CtaButton>
          </Animated.View>
        )}

        <Animated.View style={rise(2)}>
          <Pressable style={styles.link} onPress={() => navigation.navigate('Prescriptions')}>
            <View style={styles.detailIcon}>
              <FileText color={c.primary} size={16} />
            </View>
            <Text style={styles.linkText}>My Prescriptions</Text>
            <ChevronRight color={c.textMuted} size={18} />
          </Pressable>

          <Text style={styles.settingsLabel}>APPEARANCE</Text>
          <ThemeToggle />

          <Pressable style={styles.logout} onPress={logout}>
            <LogOut color={c.danger} size={18} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value, last }: { icon: React.ReactNode; label: string; value?: string; last?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.detail, last && styles.detailLast]}>
      <View style={styles.detailIcon}>{icon}</View>
      <View style={styles.flex}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

/** Button with a press-scale bounce (matches the login CTA feel). */
function CtaButton({
  children,
  onPress,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: object;
}) {
  const styles = useThemedStyles(makeStyles);
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      style={styles.flex}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.btn, style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
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
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface },

  // header
  header: { backgroundColor: c.primary, alignItems: 'center', paddingBottom: WAVE_H + 18, overflow: 'hidden' },
  circleLg: { position: 'absolute', top: -50, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' },
  circleSm: { position: 'absolute', top: 50, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.07)' },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  cameraBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF',
  },
  name: { fontSize: 19, fontWeight: '700', color: '#FFFFFF', marginTop: 12 },
  spec: { fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 3 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badgeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  badgeChipText: { fontSize: 11.5, fontWeight: '600', color: '#FFFFFF' },
  waveWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },

  // content
  content: { padding: spacing.md, paddingBottom: spacing.xl },

  // stat cards
  statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: c.background, borderRadius: radius.lg, paddingVertical: spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: c.border,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: c.primaryMuted,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 16, fontWeight: '700', color: c.text },
  statLabel: { fontSize: 11, color: c.textMuted, marginTop: 2 },

  // detail card
  card: {
    backgroundColor: c.background, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: c.border,
    shadowColor: c.primary, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border },
  detailLast: { borderBottomWidth: 0 },
  detailIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: 11.5, color: c.textMuted },
  detailValue: { fontSize: 14, color: c.text, marginTop: 1 },

  // edit form
  field: { marginBottom: spacing.md },
  input: {
    fontSize: 14, color: c.text, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: 4,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },

  // buttons
  btn: { flexDirection: 'row', gap: spacing.xs, borderRadius: radius.md, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  btnPrimary: {
    backgroundColor: c.primary,
    shadowColor: c.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  btnPrimaryText: { fontSize: 14.5, fontWeight: '700', color: '#fff' },
  btnGhost: { backgroundColor: c.primaryMuted },
  btnGhostText: { fontSize: 14.5, fontWeight: '700', color: c.primary },

  // prescriptions link
  link: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: c.background,
    borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md, borderWidth: 1, borderColor: c.border,
  },
  linkText: { fontSize: 14, fontWeight: '600', color: c.text, flex: 1 },

  // footer
  settingsLabel: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.8, color: c.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm },
  logout: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  logoutText: { fontSize: 14, fontWeight: '600', color: c.danger },
});
