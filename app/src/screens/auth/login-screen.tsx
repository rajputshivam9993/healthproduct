import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/use-auth';
import { authService } from '../../services/auth-service';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

type Step = 'phone' | 'otp';

/**
 * Phone + OTP login (Req 1, 2). Two steps: request an OTP for a 10-digit number,
 * then verify it. In backend dev mode the OTP is returned and shown here for
 * convenience; in production it arrives via SMS.
 */
export function LoginScreen() {
  const { setSession } = useAuth();
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      Alert.alert('Invalid number', 'Enter a 10-digit phone number.');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.requestOtp(phone);
      setDevOtp(result.devOtp ?? null);
      setStep('otp');
    } catch (err) {
      Alert.alert('Could not send OTP', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const { user, tokens } = await authService.verifyOtp(phone, otp);
      setSession(user, tokens);
    } catch (err) {
      Alert.alert('Verification failed', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Doctor360</Text>
        <Text style={styles.subtitle}>
          {step === 'phone' ? 'Login with your phone number' : `Enter the OTP sent to ${phone}`}
        </Text>

        {step === 'phone' ? (
          <TextInput
            style={styles.input}
            placeholder="10-digit phone number"
            placeholderTextColor={c.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="6-digit OTP"
              placeholderTextColor={c.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
            {devOtp && <Text style={styles.devHint}>Dev OTP: {devOtp}</Text>}
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={step === 'phone' ? requestOtp : verifyOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{step === 'phone' ? 'Send OTP' : 'Verify & Login'}</Text>
          )}
        </TouchableOpacity>

        {step === 'otp' && (
          <TouchableOpacity onPress={() => setStep('phone')}>
            <Text style={styles.link}>Change number</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function extractError(err: unknown): string {
  const response = (err as { response?: { data?: { message?: string } } })?.response;
  return response?.data?.message ?? 'Please check your connection and try again.';
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  title: { ...typography.h1, color: c.primary, textAlign: 'center' },
  subtitle: {
    ...typography.body,
    color: c.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  input: {
    ...typography.body,
    color: c.text,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  devHint: { ...typography.caption, color: c.accent, marginBottom: spacing.md },
  button: {
    backgroundColor: c.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: { ...typography.h3, color: '#fff' },
  link: { ...typography.body, color: c.primary, textAlign: 'center', marginTop: spacing.md },
});
