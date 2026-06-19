import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Stethoscope } from 'lucide-react-native';
import { lightPalette, spacing, typography } from '../theme';

/**
 * Animated splash (Req 18.1): logo fades in with a scale transition using
 * react-native's built-in Animated API, then calls onDone. No extra native deps,
 * so it runs in Expo Go.
 */
export function AnimatedSplash({ onDone }: { onDone: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
      Animated.delay(700),
    ]).start(() => onDone());
  }, [onDone, opacity, scale]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        <View style={styles.logo}>
          <Stethoscope color="#fff" size={48} />
        </View>
        <Text style={styles.title}>Doctor360</Text>
        <Text style={styles.tag}>Healthcare, simplified</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: lightPalette.primary },
  logo: {
    width: 96, height: 96, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  title: { ...typography.h1, color: '#fff' },
  tag: { ...typography.body, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs },
});
