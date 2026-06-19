import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { radius, spacing, type Palette } from '../theme';
import { useThemedStyles } from '../theme/theme-context';

/** Shimmer skeleton block (Req 18.3/18.10) using built-in Animated (Expo Go safe). */
export function Skeleton({ style }: { style?: ViewStyle }) {
  const styles = useThemedStyles(makeStyles);
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });
  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

/** A card-shaped skeleton placeholder for list items. */
export function SkeletonCard() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.card}>
      <Skeleton style={{ width: 52, height: 52, borderRadius: radius.md }} />
      <View style={{ flex: 1, gap: spacing.sm }}>
        <Skeleton style={{ width: '60%', height: 14 }} />
        <Skeleton style={{ width: '40%', height: 12 }} />
        <Skeleton style={{ width: '80%', height: 12 }} />
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  block: { backgroundColor: c.border, borderRadius: radius.sm },
  card: {
    flexDirection: 'row', gap: spacing.md, backgroundColor: c.background,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
});
