import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  Cake,
  Camera,
  ChevronDown,
  Droplet,
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

const { width: SCREEN_W } = Dimensions.get('window');
const WAVE_H = 46;
const mediaBase = config.apiBaseUrl.replace('/api', '');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;

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

/** Whether the profile has the essential fields filled. */
function isProfileComplete(profile: { name?: string | null; dateOfBirth?: string | null; gender?: string | null } | null | undefined): boolean {
  return !!(profile?.name && profile?.dateOfBirth && profile?.gender);
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

  const [form, setForm] = useState({ name: '', email: '', dateOfBirth: '', gender: '', bloodGroup: '', allergies: '' });
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);

  const profileComplete = isProfileComplete(profile);

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
    // Convert stored YYYY-MM-DD to display DD-MM-YYYY
    let displayDob = '';
    if (profile.dateOfBirth) {
      const parts = profile.dateOfBirth.split('-');
      if (parts.length === 3) displayDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    setForm({
      name: profile.name ?? '',
      email: profile.email ?? '',
      dateOfBirth: displayDob,
      gender: profile.gender ?? '',
      bloodGroup: profile.bloodGroup ?? '',
      allergies: profile.allergies ?? '',
    });
    setEditing(true);
  };

  /** Auto-format DOB input as DD-MM-YYYY with dashes inserted automatically. */
  const handleDobChange = (text: string) => {
    // Strip non-digits
    const digits = text.replace(/[^0-9]/g, '').slice(0, 8);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 4) formatted += '-';
      formatted += digits[i];
    }
    setForm((f) => ({ ...f, dateOfBirth: formatted }));
  };

  /** Parse DD-MM-YYYY to YYYY-MM-DD for storage. Returns null if invalid. */
  const parseDob = (display: string): string | null => {
    const match = display.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (isNaN(d.getTime()) || d > new Date()) return null;
    if (d.getDate() !== Number(dd) || d.getMonth() + 1 !== Number(mm)) return null;
    return `${yyyy}-${mm}-${dd}`;
  };

  const save = async () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!form.dateOfBirth) {
      Alert.alert('Required', 'Please enter your date of birth.');
      return;
    }
    const storedDob = parseDob(form.dateOfBirth);
    if (!storedDob) {
      Alert.alert('Invalid Date', 'Please enter a valid date in DD-MM-YYYY format.');
      return;
    }
    if (!form.gender) {
      Alert.alert('Required', 'Please select your gender.');
      return;
    }
    try {
      await update.mutateAsync({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        dateOfBirth: storedDob,
        gender: form.gender,
        bloodGroup: form.bloodGroup || undefined,
        allergies: form.allergies || undefined,
      });
      setEditing(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const detail = Array.isArray(msg) ? msg.join(', ') : msg ?? 'Please check your inputs and try again.';
      Alert.alert('Update failed', detail);
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
        {editing ? (
          <View style={styles.card}>
            {/* Name (required) */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="Full name"
                placeholderTextColor={c.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* Email (optional) */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
                placeholder="Email address"
                placeholderTextColor={c.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Date of birth (required) — auto-formatted DD-MM-YYYY */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Date of birth <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={form.dateOfBirth}
                onChangeText={handleDobChange}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={c.textMuted}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            {/* Gender (required) — chip selector */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Gender <Text style={styles.required}>*</Text></Text>
              <View style={styles.chipRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, form.gender === g && styles.chipActive]}
                    onPress={() => setForm({ ...form, gender: g })}
                  >
                    <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Blood group — select dropdown */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Blood group</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowBloodGroupPicker(true)}>
                <Text style={[styles.pickerButtonText, !form.bloodGroup && { color: c.textMuted }]}>
                  {form.bloodGroup || 'Select blood group'}
                </Text>
                <ChevronDown color={c.textMuted} size={18} />
              </TouchableOpacity>
              {showBloodGroupPicker && (
                <Modal transparent animationType="fade">
                  <Pressable style={styles.modalOverlay} onPress={() => setShowBloodGroupPicker(false)}>
                    <View style={styles.dropdownContent}>
                      <Text style={styles.dropdownTitle}>Select Blood Group</Text>
                      <View style={styles.dropdownGrid}>
                        {BLOOD_GROUPS.map((bg) => (
                          <TouchableOpacity
                            key={bg}
                            style={[styles.dropdownItem, form.bloodGroup === bg && styles.dropdownItemActive]}
                            onPress={() => { setForm({ ...form, bloodGroup: bg }); setShowBloodGroupPicker(false); }}
                          >
                            <Text style={[styles.dropdownItemText, form.bloodGroup === bg && styles.dropdownItemTextActive]}>
                              {bg}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TouchableOpacity
                        style={styles.dropdownClear}
                        onPress={() => { setForm({ ...form, bloodGroup: '' }); setShowBloodGroupPicker(false); }}
                      >
                        <Text style={styles.dropdownClearText}>Clear selection</Text>
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                </Modal>
              )}
            </View>

            {/* Allergies — optional text */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Allergies</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={form.allergies}
                onChangeText={(v) => setForm({ ...form, allergies: v })}
                placeholder="Any known allergies"
                placeholderTextColor={c.textMuted}
                multiline
              />
            </View>

            <View style={styles.row}>
              <CtaButton style={styles.btnPrimary} onPress={save} disabled={update.isPending}>
                {update.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Save</Text>}
              </CtaButton>
              <CtaButton style={styles.btnGhost} onPress={() => setEditing(false)}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </CtaButton>
            </View>
          </View>
        ) : !profileComplete ? (
          /* Incomplete profile — prompt to complete */
          <Animated.View style={[styles.card, rise(0)]}>
            <View style={styles.incompleteHeader}>
              <ShieldAlert color={c.primary} size={22} />
              <Text style={styles.incompleteTitle}>Complete your profile</Text>
            </View>
            <Text style={styles.incompleteDesc}>
              Please fill in your personal details to book appointments and get the best experience.
            </Text>
            <CtaButton style={styles.btnPrimary} onPress={startEdit}>
              <Pencil color="#fff" size={16} />
              <Text style={styles.btnPrimaryText}>Complete Profile</Text>
            </CtaButton>
          </Animated.View>
        ) : (
          /* Complete profile — show details */
          <Animated.View style={[styles.card, rise(1)]}>
            <DetailRow icon={<Phone color={c.primary} size={16} />} label="Phone" value={profile?.phone ?? '—'} />
            <DetailRow icon={<Mail color={c.primary} size={16} />} label="Email" value={profile?.email ?? '—'} />
            <DetailRow icon={<Cake color={c.primary} size={16} />} label="Date of birth" value={profile?.dateOfBirth ?? '—'} />
            <DetailRow icon={<VenusAndMars color={c.primary} size={16} />} label="Gender" value={profile?.gender ?? '—'} />
            <DetailRow icon={<Droplet color={c.primary} size={16} />} label="Blood group" value={profile?.bloodGroup ?? '—'} />
            <DetailRow icon={<ShieldAlert color={c.primary} size={16} />} label="Allergies" value={profile?.allergies ?? '—'} last />

            <CtaButton style={styles.btnPrimary} onPress={startEdit}>
              <Pencil color="#fff" size={16} />
              <Text style={styles.btnPrimaryText}>Edit Profile</Text>
            </CtaButton>
          </Animated.View>
        )}

        <Animated.View style={rise(2)}>
          <Pressable style={styles.logout} onPress={logout}>
            <LogOut color={c.danger} size={18} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
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
  waveWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },

  // content
  content: { padding: spacing.md, paddingBottom: spacing.xl },

  // incomplete profile prompt
  incompleteHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  incompleteTitle: { fontSize: 16, fontWeight: '700', color: c.text },
  incompleteDesc: { fontSize: 14, color: c.textMuted, marginBottom: spacing.sm, lineHeight: 20 },

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
  fieldLabel: { fontSize: 12, fontWeight: '600', color: c.textMuted, marginBottom: 6 },
  required: { color: c.danger },
  input: {
    fontSize: 14, color: c.text, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: 4,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  pickerButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4,
  },
  pickerButtonText: { fontSize: 14, color: c.text },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface,
  },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: c.text },
  chipTextActive: { color: '#fff' },
  // modal / dropdown
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  dropdownContent: {
    backgroundColor: c.background, borderRadius: radius.lg, margin: spacing.lg, padding: spacing.md, width: '85%',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  dropdownTitle: { fontSize: 15, fontWeight: '700', color: c.text, marginBottom: spacing.md, textAlign: 'center' },
  dropdownGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  dropdownItem: {
    width: '21%', alignItems: 'center', paddingVertical: spacing.sm + 4,
    borderRadius: radius.sm, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface,
  },
  dropdownItemActive: { backgroundColor: c.primary, borderColor: c.primary },
  dropdownItemText: { fontSize: 14, fontWeight: '600', color: c.text },
  dropdownItemTextActive: { color: '#fff' },
  dropdownClear: { alignItems: 'center', marginTop: spacing.md, paddingVertical: spacing.sm },
  dropdownClearText: { fontSize: 13, color: c.textMuted },
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

  // footer
  settingsLabel: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.8, color: c.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm },
  logout: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  logoutText: { fontSize: 14, fontWeight: '600', color: c.danger },
});
