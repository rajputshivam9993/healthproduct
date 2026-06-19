import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { VideoCallParams } from '../../navigation/types';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  PhoneOff,
  SwitchCamera,
  Video as VideoIcon,
} from 'lucide-react-native';
import { appointmentService, type AgoraCredentials } from '../../services/appointment-service';
import { lightPalette, radius, spacing, typography } from '../../theme';

/**
 * Video consultation screen (Req 9.3). Fetches an Agora token via the backend
 * (start → IN_PROGRESS) and provides mute/camera/flip/end controls. The live
 * video engine (react-native-agora) requires a custom dev build and is not bundled
 * in Expo Go, so the video surface shows a placeholder while controls/lifecycle work.
 */
export function VideoCallScreen() {
  const route = useRoute<RouteProp<{ VideoCall: VideoCallParams }, 'VideoCall'>>();
  const navigation = useNavigation();
  const { appointmentId, peerName } = route.params;

  const [creds, setCreds] = useState<AgoraCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);

  useEffect(() => {
    let active = true;
    appointmentService
      .start(appointmentId)
      .then((res) => {
        if (active) setCreds(res.agora);
      })
      .catch(() => Alert.alert('Could not start call', 'Please try again.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [appointmentId]);

  const endCall = async () => {
    try {
      await appointmentService.complete(appointmentId);
    } catch {
      // ignore — best effort
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <VideoIcon color="#3A4A63" size={64} />
            <Text style={styles.peer}>{peerName}</Text>
            <Text style={styles.note}>
              {creds?.mock
                ? 'Dev mode: live video needs a custom dev build (not Expo Go).'
                : 'Connecting video…'}
            </Text>
            <Text style={styles.channel}>Channel: {creds?.channel?.slice(0, 8)}…</Text>
          </>
        )}
      </View>

      <View style={styles.controls}>
        <ControlButton
          icon={muted ? <MicOff color="#fff" size={22} /> : <Mic color="#fff" size={22} />}
          active={muted}
          onPress={() => setMuted((m) => !m)}
        />
        <ControlButton
          icon={cameraOn ? <Camera color="#fff" size={22} /> : <CameraOff color="#fff" size={22} />}
          active={!cameraOn}
          onPress={() => setCameraOn((c) => !c)}
        />
        <ControlButton icon={<SwitchCamera color="#fff" size={22} />} onPress={() => undefined} />
        <ControlButton icon={<PhoneOff color="#fff" size={24} />} danger onPress={endCall} />
      </View>
    </View>
  );
}

function ControlButton({
  icon,
  onPress,
  active,
  danger,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.ctrl, active && styles.ctrlActive, danger && styles.ctrlDanger]}
      onPress={onPress}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  peer: { ...typography.h2, color: '#fff' },
  note: { ...typography.caption, color: '#8FA1BC', textAlign: 'center', paddingHorizontal: spacing.xl },
  channel: { ...typography.caption, color: '#5B6B82' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  ctrl: {
    width: 56, height: 56, borderRadius: radius.pill, backgroundColor: '#1E2A40',
    alignItems: 'center', justifyContent: 'center',
  },
  ctrlActive: { backgroundColor: '#3A4A63' },
  ctrlDanger: { backgroundColor: lightPalette.danger },
});
