import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DoctorTabNavigator } from './doctor-tab-navigator';
import { ConsultationDetailScreen } from '../screens/doctor/consultation-detail-screen';
import { VideoCallScreen } from '../screens/shared/video-call-screen';
import { ChatScreen } from '../screens/shared/chat-screen';
import type { DoctorStackParamList } from './types';
import { lightPalette } from '../theme';

// Wraps the doctor tabs in a stack for consultation detail, video, and chat.
const Stack = createNativeStackNavigator<DoctorStackParamList>();

export function DoctorStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerStyle: { backgroundColor: lightPalette.background }, headerTintColor: lightPalette.text }}
    >
      <Stack.Screen name="Tabs" component={DoctorTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ConsultationDetail" component={ConsultationDetailScreen} options={{ title: 'Consultation' }} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.peerName })}
      />
    </Stack.Navigator>
  );
}
