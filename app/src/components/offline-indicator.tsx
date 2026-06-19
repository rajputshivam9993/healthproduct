import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { spacing, typography } from '../theme';

/** Visual offline indicator shown when there is no connectivity (Req 16.6). */
export function OfflineIndicator() {
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);

  useEffect(() => NetInfo.addEventListener((state) => setOffline(!state.isConnected)), []);

  if (!offline) return null;
  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.xs }]}>
      <WifiOff color="#fff" size={14} />
      <Text style={styles.text}>You are offline — showing saved data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#5B6B82', paddingBottom: spacing.xs,
  },
  text: { ...typography.caption, color: '#fff', fontWeight: '600' },
});
