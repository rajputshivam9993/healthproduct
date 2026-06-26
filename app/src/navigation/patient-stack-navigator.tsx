import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PatientTabNavigator } from './patient-tab-navigator';
import { DoctorBookingScreen } from '../screens/patient/doctor-booking-screen';
import { PatientDetailScreen } from '../screens/patient/patient-detail-screen';
import { SpecialitiesScreen } from '../screens/patient/specialities-screen';
import { VideoCallScreen } from '../screens/shared/video-call-screen';
import { ChatScreen } from '../screens/shared/chat-screen';
import { ReviewSubmitScreen } from '../screens/patient/review-submit-screen';
import { PrescriptionsScreen } from '../screens/patient/prescriptions-screen';
import type { PatientStackParamList } from './types';
import { lightPalette } from '../theme';

// Wraps the patient tabs in a stack so doctor cards can push a booking screen.
const Stack = createNativeStackNavigator<PatientStackParamList>();

export function PatientStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: lightPalette.background },
        headerTintColor: lightPalette.text,
      }}
    >
      <Stack.Screen name="Tabs" component={PatientTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="DoctorBooking"
        component={DoctorBookingScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ title: 'Patient Details' }}
      />
      <Stack.Screen
        name="Specialities"
        component={SpecialitiesScreen}
        options={{ title: 'Specialities' }}
      />
      <Stack.Screen
        name="VideoCall"
        component={VideoCallScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.peerName })}
      />
      <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} options={{ title: 'Write a review' }} />
      <Stack.Screen name="Prescriptions" component={PrescriptionsScreen} options={{ title: 'Prescriptions' }} />
    </Stack.Navigator>
  );
}
