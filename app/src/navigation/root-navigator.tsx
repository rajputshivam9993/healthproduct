import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/auth-store';
import { LoginScreen } from '../screens/auth/login-screen';
import { PatientStackNavigator } from './patient-stack-navigator';
import { DoctorStackNavigator } from './doctor-stack-navigator';
import { lightPalette } from '../theme';

// Top-level navigator. Switches between the auth stack and the role-appropriate
// tab navigator based on authentication state and role (Req 18.11, 21.1). Waits
// for the persisted session to rehydrate before rendering to avoid a flash of
// the login screen for already-signed-in users.
const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={lightPalette.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : role === 'DOCTOR' ? (
        <Stack.Screen name="DoctorRoot" component={DoctorStackNavigator} />
      ) : (
        <Stack.Screen name="PatientRoot" component={PatientStackNavigator} />
      )}
    </Stack.Navigator>
  );
}
