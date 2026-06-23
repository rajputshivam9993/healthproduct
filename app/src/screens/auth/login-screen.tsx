import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { ArrowLeft, Check, Clock, Lock, Sparkles, Stethoscope } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../hooks/use-auth';
import { authService } from '../../services/auth-service';
import type { AuthTokens, User as AppUser } from '../../types';

const COLORS = {
  primary: '#6C3FE8',
  primaryDark: '#5A2FD0',
  background: '#FFFFFF',
  accentLight: '#F0EAFF',
  textPrimary: '#1A1A2E',
  textMuted: '#888888',
  border: '#E0D7FC',
  inputBg: '#FAF8FF',
  white: '#FFFFFF',
  success: '#22C55E',
} as const;

type Step = 'phone' | 'otp';

const { width: SCREEN_W } = Dimensions.get('window');
const WAVE_H = 54;
const OTP_LEN = 6;
const RESEND_SECONDS = 30;

// Segmented role-selector geometry (body has 24px horizontal padding).
const SEG_PAD = 5;
const SEG_INNER = SCREEN_W - 48 - SEG_PAD * 2;
const SEG_HALF = SEG_INNER / 2;


/**
 * Phone + OTP login (Req 1, 2). Two steps share one screen: request an OTP for a
 * 10-digit number, then verify it. In backend dev mode the OTP is returned and
 * shown for convenience; in production it arrives via SMS.
 */
export function LoginScreen() {
  const { setSession } = useAuth();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- header animations (shared by both steps) ---
  const headerY = useRef(new Animated.Value(-70)).current; // slide-down on mount
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current; // looping logo pulse
  const floatA = useRef(new Animated.Value(0)).current; // floating decor circles
  const floatB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Header eases down from -70 and fades in over 550ms.
    Animated.parallel([
      Animated.timing(headerY, { toValue: 0, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Logo breathes 1.0 -> 1.05 -> 1.0 on a ~3s loop.
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 1.05, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    // Two decorative circles drift slowly up/down on offset loops for depth.
    const drift = (v: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
    drift(floatA, 4000).start();
    drift(floatB, 5200).start();
  }, [headerY, headerOpacity, logoScale, floatA, floatB]);

  const floatAY = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const floatBY = floatB.interpolate({ inputRange: [0, 1], outputRange: [0, 16] });

  const requestOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      Alert.alert('Invalid number', 'Enter a valid 10-digit mobile number.');
      return;
    }
    Haptics.selectionAsync().catch(() => {});

    setLoading(true);
    try {
      // Real backend OTP request. In dev mode the server accepts 123456 for any
      // number, so every login yields a real session (and thus real data).
      const result = await authService.requestOtp(phone);
      setDevOtp(result.devOtp ?? null);
      setStep('otp');
    } catch (err) {
      Alert.alert('Could not send OTP', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* ---------- Purple header (slides down on mount) ---------- */}
      <Animated.View
        style={[
          styles.header,
          { paddingTop: insets.top + 54, opacity: headerOpacity, transform: [{ translateY: headerY }] },
        ]}
      >
        {/* Floating decorative circles */}
        <Animated.View style={[styles.circleLg, { transform: [{ translateY: floatAY }] }]} pointerEvents="none" />
        <Animated.View style={[styles.circleSm, { transform: [{ translateY: floatBY }] }]} pointerEvents="none" />

        {step === 'phone' ? (
          <>
            <Animated.View style={[styles.logoCircle, { transform: [{ scale: logoScale }] }]}>
              <Stethoscope size={28} color={COLORS.white} strokeWidth={2.2} />
            </Animated.View>
            <Text style={styles.appName}>Doctor 360</Text>
            <Text style={styles.tagline}>Your health, our priority</Text>
          </>
        ) : (
          <View style={styles.otpHeaderInner}>
            <Pressable style={styles.backBtn} onPress={() => setStep('phone')} hitSlop={10}>
              <ArrowLeft size={20} color={COLORS.white} strokeWidth={2.4} />
            </Pressable>
            <Text style={styles.otpTitle}>OTP Verification</Text>
            <Text style={styles.otpSubtitle}>Sent to +91 XXXXXX{phone.slice(-4)}</Text>
          </View>
        )}

        {/* Wave transition from purple to white */}
        <View style={styles.waveWrap} pointerEvents="none">
          <Svg width={SCREEN_W} height={WAVE_H} viewBox={`0 0 ${SCREEN_W} ${WAVE_H}`}>
            <Path
              d={`M0,32 C ${SCREEN_W * 0.3},2 ${SCREEN_W * 0.7},${WAVE_H} ${SCREEN_W},16 L ${SCREEN_W},${WAVE_H} L 0,${WAVE_H} Z`}
              fill={COLORS.background}
            />
          </Svg>
        </View>
      </Animated.View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          {/* Soft, blurred illustration sitting behind the form (decorative). */}
          <Image
            source={require('../../../assets/vaccination.png')}
            blurRadius={3}
            resizeMode="contain"
            style={styles.bgImage}
          />
          <View style={styles.bgWash} pointerEvents="none" />

          {/* Scrollable so the inputs stay reachable above the keyboard. */}
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.bodyScroll, { paddingBottom: insets.bottom + 20 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {step === 'phone' ? (
              <PhoneStep phone={phone} setPhone={setPhone} loading={loading} onSubmit={requestOtp} />
            ) : (
              <OtpStep phone={phone} devOtp={devOtp} onVerified={setSession} onResend={requestOtp} />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* =========================================================================
   STEP 1 — phone number
   ========================================================================= */
function PhoneStep({
  phone,
  setPhone,
  loading,
  onSubmit,
}: {
  phone: string;
  setPhone: (p: string) => void;
  loading: boolean;
  onSubmit: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const glow = useRef(new Animated.Value(0)).current; // input focus glow (non-native: colour/shadow)
  const ctaScale = useRef(new Animated.Value(1)).current; // CTA press bounce
  const ctaPulse = useRef(new Animated.Value(1)).current; // CTA gentle breathing pulse
  const shimmer = useRef(new Animated.Value(0)).current; // CTA loading shimmer sweep
  // One value per section — staggered slide+fade entrance.
  const stagger = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Sections pop into place one after another (spring overshoots slightly for a "pop").
    Animated.stagger(
      90,
      stagger.map((v) =>
        Animated.spring(v, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
      ),
    ).start();
  }, [stagger]);

  useEffect(() => {
    // CTA breathes gently (1.0 -> 1.03 -> 1.0) to draw the eye, on a ~1.8s loop.
    Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, { toValue: 1.03, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(ctaPulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [ctaPulse]);

  useEffect(() => {
    if (!loading) return;
    // Sweep a translucent highlight across the button while the request is in flight.
    shimmer.setValue(0);
    const loop = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [loading, shimmer]);

  // Focus glow fades border colour + shadow in/out (cannot use the native driver).
  const handleFocus = () => {
    setFocused(true);
    Animated.timing(glow, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    Animated.timing(glow, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };
  const borderColor = glow.interpolate({ inputRange: [0, 1], outputRange: [COLORS.border, COLORS.primary] });
  const shadowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] });
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-160, SCREEN_W] });

  const pressIn = () => Animated.spring(ctaScale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(ctaScale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start();

  // Each section pops in: scales up from 0.85 with a fade (spring gives the bounce).
  const rise = (i: number) => ({
    opacity: stagger[i],
    transform: [
      { scale: stagger[i].interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
      { translateY: stagger[i].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  });

  return (
    <>
      <Animated.View style={rise(0)}>
        <View style={styles.badge}>
          <Sparkles size={12} color={COLORS.primary} strokeWidth={2.4} />
          <Text style={styles.badgeText}>WELCOME TO DOCTOR 360</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.block, rise(1)]}>
        <Text style={styles.label}>MOBILE NUMBER</Text>
        <Animated.View
          style={[
            styles.inputRow,
            {
              borderColor,
              shadowColor: COLORS.primary,
              shadowOpacity,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
              elevation: focused ? 4 : 0,
            },
          ]}
        >
          <Text style={styles.flag}>🇮🇳</Text>
          <Text style={styles.code}>+91</Text>
          <View style={styles.divider} />
          <TextInput
            style={styles.input}
            placeholder="00000 00000"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View style={rise(2)}>
        {/* Combine the breathing pulse with the press-bounce on one scale. */}
        <Animated.View style={[styles.ctaWrap, { transform: [{ scale: Animated.multiply(ctaScale, ctaPulse) }] }]}>
          <Pressable style={styles.cta} onPressIn={pressIn} onPressOut={pressOut} onPress={onSubmit} disabled={loading}>
            {loading && <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]} />}
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.ctaText}>Send OTP</Text>}
          </Pressable>
        </Animated.View>
        <View style={styles.secure}>
          <Lock size={13} color={COLORS.textMuted} strokeWidth={2.2} />
          <Text style={styles.secureText}>256-bit encrypted · HIPAA safe</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.footer, rise(3)]}>
        <Text style={styles.terms}>
          By continuing you agree to our <Text style={styles.termsLink}>Terms</Text> &{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </>
  );
}

/* =========================================================================
   STEP 2 — OTP verification
   ========================================================================= */
const RING_SIZE = 40;
const RING_STROKE = 3;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function OtpStep({
  phone,
  devOtp,
  onVerified,
  onResend,
}: {
  phone: string;
  devOtp: string | null;
  onVerified: (...args: Parameters<ReturnType<typeof useAuth>['setSession']>) => void;
  onResend: () => void;
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);

  // Per-box bounce, container shake, success flash, countdown ring, content entrance.
  const scales = useRef(Array.from({ length: OTP_LEN }, () => new Animated.Value(1))).current;
  const prevLen = useRef(0);
  const shake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = () => {
    setSecondsLeft(RESEND_SECONDS);
    ring.setValue(1);
    Animated.timing(ring, {
      toValue: 0,
      duration: RESEND_SECONDS * 1000,
      easing: Easing.linear,
      useNativeDriver: false, // strokeDashoffset is not native-driver friendly
    }).start();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1 && intervalRef.current) clearInterval(intervalRef.current);
        return Math.max(0, s - 1);
      });
    }, 1000);
  };

  useEffect(() => {
    // Content fades + rises in on entering the OTP step.
    Animated.timing(enter, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    startCountdown();
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bounce the box that just received a digit: 1.0 -> 1.12 -> 1.0.
  useEffect(() => {
    if (code.length > prevLen.current && code.length <= OTP_LEN) {
      const i = code.length - 1;
      Animated.sequence([
        Animated.spring(scales[i], { toValue: 1.12, useNativeDriver: true }),
        Animated.spring(scales[i], { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
      Haptics.selectionAsync().catch(() => {});
    }
    prevLen.current = code.length;
  }, [code, scales]);

  const runShake = () => {
    // Horizontal shake: -8 -> 8 -> -6 -> 6 -> 0 over ~400ms.
    shake.setValue(0);
    Animated.sequence(
      [-8, 8, -6, 6, 0].map((to) => Animated.timing(shake, { toValue: to, duration: 70, useNativeDriver: true })),
    ).start();
  };

  // Plays the green flash + checkmarks, then signs in (root navigator switches).
  const finishLogin = (user: AppUser, tokens: AuthTokens) => {
    setVerified(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.timing(flash, { toValue: 1, duration: 250, useNativeDriver: false }).start(() => {
      setTimeout(() => onVerified(user, tokens), 350);
    });
  };

  const verify = async (value: string) => {
    setLoading(true);
    try {
      // Real backend verification → real tokens, so every screen loads live data.
      // In dev the server accepts 123456 for any number (see auth.service.ts).
      const { user, tokens } = await authService.verifyOtp(phone, value);
      finishLogin(user, tokens);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      runShake();
      setCode('');
      Alert.alert('Verification failed', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const onChange = (t: string) => {
    if (verified) return;
    const next = t.replace(/[^0-9]/g, '').slice(0, OTP_LEN);
    setCode(next);
    if (next.length === OTP_LEN) verify(next);
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    setCode('');
    onResend();
    startCountdown();
  };

  const filled = code.length === OTP_LEN;
  const boxBg = flash.interpolate({ inputRange: [0, 1], outputRange: [COLORS.accentLight, '#DCFCE7'] });
  const boxBorder = flash.interpolate({ inputRange: [0, 1], outputRange: [COLORS.primary, COLORS.success] });
  const ringOffset = ring.interpolate({ inputRange: [0, 1], outputRange: [RING_C, 0] });
  const mmss = `00:${String(secondsLeft).padStart(2, '0')}`;
  const enterStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  return (
    <Animated.View style={enterStyle}>
      <Text style={styles.heading}>Enter verification code</Text>
      <Text style={styles.headingSub}>We sent a 6-digit code to your mobile.</Text>

      {/* Hidden input drives all 6 boxes; the boxes are purely visual. */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={onChange}
        keyboardType="number-pad"
        maxLength={OTP_LEN}
        caretHidden
        style={styles.hiddenInput}
        autoFocus
      />

      <Pressable onPress={() => inputRef.current?.focus()} style={styles.otpPress}>
        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shake }] }]}>
          {Array.from({ length: OTP_LEN }).map((_, i) => {
            const char = code[i] ?? '';
            const isActive = i === code.length && !verified;
            const isFilled = Boolean(char) || verified;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.otpBox,
                  isActive && styles.otpBoxActive,
                  isFilled && { backgroundColor: boxBg, borderColor: boxBorder },
                ]}
              >
                {verified ? (
                  <Check size={22} color={COLORS.success} strokeWidth={3} />
                ) : (
                  <Animated.Text style={[styles.otpDigit, { transform: [{ scale: scales[i] }] }]}>{char}</Animated.Text>
                )}
              </Animated.View>
            );
          })}
        </Animated.View>
      </Pressable>

      {devOtp ? <Text style={styles.devHint}>Dev OTP: {devOtp}</Text> : null}

      <View style={styles.resendRow}>
        <View style={styles.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke={COLORS.border} strokeWidth={RING_STROKE} fill="none" />
            <AnimatedCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke={COLORS.primary}
              strokeWidth={RING_STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={ringOffset}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
          <Text style={styles.ringText}>{secondsLeft}</Text>
        </View>
        {secondsLeft > 0 ? (
          <Text style={styles.resendMuted}>Resend OTP in {mmss}</Text>
        ) : (
          <Pressable onPress={handleResend} hitSlop={8}>
            <Text style={styles.resendActive}>Resend OTP</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.ctaWrap}>
        <Pressable
          style={[styles.cta, !filled && styles.ctaDisabled]}
          onPress={() => filled && verify(code)}
          disabled={!filled || loading}
        >
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.ctaText}>Verify & Continue</Text>}
        </Pressable>
      </View>

      <View style={styles.secure}>
        <Clock size={13} color={COLORS.textMuted} strokeWidth={2.2} />
        <Text style={styles.secureText}>OTP valid for 10 minutes</Text>
      </View>
    </Animated.View>
  );
}

function extractError(err: unknown): string {
  const response = (err as { response?: { data?: { message?: string } } })?.response;
  return response?.data?.message ?? 'Please check your connection and try again.';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },

  // header
  header: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingBottom: WAVE_H + 70,
    overflow: 'hidden',
  },
  circleLg: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circleSm: {
    position: 'absolute',
    top: 60,
    left: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  appName: { color: COLORS.white, fontSize: 18, fontWeight: '700', marginTop: 10, letterSpacing: 0.3 },
  tagline: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 4 },
  otpHeaderInner: { alignSelf: 'stretch', paddingHorizontal: 24, alignItems: 'center', paddingTop: 6 },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  otpSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 5 },
  waveWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },

  // body
  body: { flex: 1, overflow: 'hidden' },
  bodyScroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 22 },
  bgImage: {
    position: 'absolute',
    left: -10,
    right: -10,
    bottom: 24,
    width: SCREEN_W + 20,
    height: 300,
    opacity: 0.16,
  },
  // A translucent white wash keeps the form crisp over the illustration.
  bgWash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.35)' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 12,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.6 },
  heading: { fontSize: 15.5, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.2 },
  headingAccent: { color: COLORS.primary },
  headingSub: { fontSize: 12.5, color: COLORS.textMuted, marginTop: 6, flexShrink: 1 },
  block: { marginTop: 22 },
  footer: { marginTop: 'auto', paddingTop: 16 },

  // segmented role selector
  segment: {
    flexDirection: 'row',
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.accentLight,
    padding: SEG_PAD,
  },
  segHighlight: {
    position: 'absolute',
    top: SEG_PAD,
    left: SEG_PAD,
    bottom: SEG_PAD,
    width: SEG_HALF,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  segHalf: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  segText: { fontSize: 13, fontWeight: '600' },

  // phone input
  label: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.8, color: COLORS.textMuted, marginBottom: 7 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 13,
  },
  flag: { fontSize: 16 },
  code: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginLeft: 7 },
  divider: { width: 1, height: 22, backgroundColor: COLORS.border, marginHorizontal: 11 },
  input: { flex: 1, fontSize: 14, color: COLORS.textPrimary, letterSpacing: 0.8, padding: 0 },

  // OTP boxes
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  otpPress: { marginTop: 24 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  otpBox: {
    width: 44,
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  otpDigit: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  devHint: { fontSize: 13, color: COLORS.primary, marginTop: 12, textAlign: 'center' },

  // resend
  resendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22 },
  ringWrap: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', fontSize: 12, fontWeight: '700', color: COLORS.primary },
  resendMuted: { fontSize: 14, color: COLORS.textMuted },
  resendActive: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  // CTA (shared)
  ctaWrap: { alignSelf: 'stretch', width: '100%', marginTop: 24 },
  cta: {
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: COLORS.white, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 90,
    backgroundColor: 'rgba(255,255,255,0.25)',
    transform: [{ skewX: '-20deg' }],
  },

  // footer notes
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  secureText: { fontSize: 11.5, color: COLORS.textMuted },
  terms: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginBottom: 8, lineHeight: 18 },
  termsLink: { color: COLORS.primary, fontWeight: '600' },
});
