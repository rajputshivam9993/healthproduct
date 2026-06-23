import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, Home, User } from 'lucide-react-native';
import { PatientHomeScreen } from '../screens/patient/home-screen';
import { PatientAppointmentsScreen } from '../screens/patient/appointments-screen';
import { PatientProfileScreen } from '../screens/patient/profile-screen';
import { usePalette } from '../theme/theme-context';

// Bottom tabs rendered for PATIENT users: Home, Appointments, Profile.
const Tab = createBottomTabNavigator();

export function PatientTabNavigator() {
  const c = usePalette();
  // Respect the device's bottom safe-area inset (Android gesture/nav bar,
  // iOS home indicator) so the tab bar never sits under the system buttons.
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.background,
          borderTopColor: c.border,
          height: 64 + bottomInset,
          paddingBottom: bottomInset + 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={PatientHomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Appointments"
        component={PatientAppointmentsScreen}
        options={{ tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={PatientProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
