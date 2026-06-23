import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Location from 'expo-location';
import {
  Award,
  BadgeCheck,
  Briefcase,
  Crosshair,
  FileText,
  IndianRupee,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Star,
  Stethoscope,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/use-auth';
import { useAppModal } from '../../components/app-modal';
import { useMyDoctorProfile, useUpdateMyDoctorProfile } from '../../hooks/use-doctor-profile';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

const { width: SCREEN_W } = Dimensions.get('window');
const WAVE_H = 46;

/** Doctor profile: view professional details + edit editable fields (Req 21.6, 4.2). */
export function DoctorProfileScreen() {
  const { logout } = useAuth();
  const { showAlert } = useAppModal();
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useMyDoctorProfile();
  const update = useUpdateMyDoctorProfile();
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({ specialization: '', experienceYears: '', consultationFee: '', clinicAddress: '', bio: '' });
  const [locating, setLocating] = useState(false);

  // Capture the doctor's clinic address from GPS — same approach as patient home
  // (permission -> current position -> reverse geocode). Saves address + lat/long.
  const updateAddress = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert({ type: 'warning', title: 'Permission needed', message: 'Enable location permission to capture your clinic address.' });
        return;
      }

      let pos: Location.LocationObject | null = null;
      try {
        pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch {
        pos = await Location.getLastKnownPositionAsync();
      }
      if (!pos) {
        showAlert({ type: 'error', title: 'Location unavailable', message: 'Could not get your current location. Please try again.' });
        return;
      }

      const { latitude, longitude } = pos.coords;
      let address = '';
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results && results.length > 0) {
          const place = results[0];
          const parts = [place.name, place.street, place.district, place.subregion, place.city, place.region, place.postalCode].filter(
            Boolean,
          ) as string[];
          address = [...new Set(parts)].join(', ');
        }
      } catch {
        // Reverse geocoding can be unavailable on emulators — fall back to coords.
      }

      await update.mutateAsync({
        clinicAddress: address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        latitude,
        longitude,
      });
      showAlert({ type: 'success', title: 'Address updated', message: 'Your clinic location has been saved.' });
    } catch (err) {
      // Surface the real cause: "Network Error" => app can't reach the backend
      // (restart with --clear); otherwise the backend's validation message.
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const reason = e?.response?.data?.message ?? e?.message ?? 'Please check your connection and try again.';
      showAlert({ type: 'error', title: 'Update failed', message: String(reason) });
    } finally {
      setLocating(false);
    }
  };

  // --- animations (mirror the login screen) ---
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
      showAlert({ type: 'success', title: 'Profile saved', message: 'Your changes have been updated.' });
    } catch {
      showAlert({ type: 'error', title: 'Update failed', message: 'Could not save your profile. Please try again.' });
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
    <View style={styles.container}>
      {/* ---------- Purple header ---------- */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 28, opacity: headerOpacity, transform: [{ translateY: headerY }] }]}
      >
        <Animated.View style={[styles.circleLg]} pointerEvents="none" />
        <Animated.View style={[styles.circleSm]} pointerEvents="none" />

        <Animated.View style={[styles.avatar, { transform: [{ scale: avatarScale }] }]}>
          <Stethoscope color="#FFFFFF" size={30} strokeWidth={2.2} />
        </Animated.View>
        <Text style={styles.name}>{profile?.user.name ?? 'Doctor'}</Text>
        <Text style={styles.spec}>{profile?.specialization ?? 'Specialization not set'}</Text>

        <View style={styles.badges}>
          {profile?.verificationStatus === 'VERIFIED' && (
            <View style={styles.badgeChip}>
              <BadgeCheck color="#FFFFFF" size={14} />
              <Text style={styles.badgeChipText}>Verified</Text>
            </View>
          )}
          <View style={styles.badgeChip}>
            <Star color="#FFD479" size={14} fill="#FFD479" />
            <Text style={styles.badgeChipText}>
              {profile?.avgRating ?? '0'} ({profile?.totalReviews ?? 0})
            </Text>
          </View>
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
            <StatCard icon={<Briefcase color={c.primary} size={18} />} value={`${profile?.experienceYears ?? 0}`} label="Years exp" />
            <StatCard icon={<IndianRupee color={c.primary} size={18} />} value={profile?.consultationFee ? `₹${profile.consultationFee}` : '—'} label="Fee" />
            <StatCard icon={<Star color={c.primary} size={18} />} value={`${profile?.avgRating ?? '0'}`} label={`${profile?.totalReviews ?? 0} reviews`} />
          </Animated.View>
        )}

        {editing ? (
          <View style={styles.card}>
            <EditField label="Specialization" value={form.specialization} onChange={(v) => setForm({ ...form, specialization: v })} />
            <EditField label="Experience (years)" value={form.experienceYears} keyboardType="number-pad" onChange={(v) => setForm({ ...form, experienceYears: v })} />
            <EditField label="Consultation fee (₹)" value={form.consultationFee} keyboardType="number-pad" onChange={(v) => setForm({ ...form, consultationFee: v })} />
            <EditField label="Clinic address" value={form.clinicAddress} onChange={(v) => setForm({ ...form, clinicAddress: v })} />
            <EditField label="Bio" value={form.bio} multiline onChange={(v) => setForm({ ...form, bio: v })} />
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
            <DetailRow icon={<Phone color={c.primary} size={16} />} label="Phone" value={profile?.user.phone} />
            <DetailRow icon={<Mail color={c.primary} size={16} />} label="Email" value={profile?.user.email ?? '—'} />
            <DetailRow icon={<Award color={c.primary} size={16} />} label="Qualification" value={profile?.qualification ?? '—'} />
            <DetailRow icon={<FileText color={c.primary} size={16} />} label="Bio" value={profile?.bio ?? '—'} last />

            {/* Clinic address + one-tap GPS update */}
            <View style={styles.addressBlock}>
              <View style={styles.addressHeader}>
                <View style={styles.detailIcon}>
                  <MapPin color={c.primary} size={16} />
                </View>
                <Text style={styles.addressTitle}>Clinic Address</Text>
                <SmallButton onPress={updateAddress} disabled={locating}>
                  {locating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Crosshair color="#fff" size={13} strokeWidth={2.4} />
                      <Text style={styles.smallBtnText}>Update</Text>
                    </>
                  )}
                </SmallButton>
              </View>
              <Text style={styles.addressValue}>
                {profile?.clinicAddress ?? 'Not set — tap Update to use your current location'}
              </Text>
              {profile?.latitude && profile?.longitude ? (
                <View style={styles.coordsRow}>
                  <MapPin color={c.textMuted} size={12} />
                  <Text style={styles.coords}>
                    {Number(profile.latitude).toFixed(5)}, {Number(profile.longitude).toFixed(5)}
                  </Text>
                </View>
              ) : null}
            </View>

            <CtaButton style={styles.btnPrimary} onPress={startEdit}>
              <Pencil color="#fff" size={16} />
              <Text style={styles.btnPrimaryText}>Edit profile</Text>
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

/** Small pill button with a press-scale bounce (for "Update Address"). */
function SmallButton({
  children,
  onPress,
  disabled,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
    >
      <Animated.View style={[styles.smallBtn, { transform: [{ scale }] }]}>{children}</Animated.View>
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

  // address block + update button
  addressBlock: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: c.border },
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  addressTitle: { flex: 1, fontSize: 12.5, fontWeight: '600', color: c.text },
  addressValue: { fontSize: 14, color: c.text, marginTop: spacing.sm, lineHeight: 20 },
  coordsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  coords: { fontSize: 11.5, color: c.textMuted },
  smallBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: c.primary, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, minWidth: 78,
    shadowColor: c.primary, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  smallBtnText: { fontSize: 12.5, fontWeight: '700', color: '#fff' },

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

  // footer
  settingsLabel: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.8, color: c.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm },
  logout: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  logoutText: { fontSize: 14, fontWeight: '600', color: c.danger },
});
