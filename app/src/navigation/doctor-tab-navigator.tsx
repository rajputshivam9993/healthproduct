import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Stethoscope, User } from 'lucide-react-native';
import { DoctorDashboardScreen } from '../screens/doctor/dashboard-screen';
import { DoctorConsultationsScreen } from '../screens/doctor/consultations-screen';
import { DoctorProfileScreen } from '../screens/doctor/profile-screen';
import { usePalette } from '../theme/theme-context';

// Bottom tabs rendered for DOCTOR users (Doctor_Tab_Navigator): Home,
// Appointments, Profile. The Calendar tab was removed — doctors no longer
// add slots themselves.
const Tab = createBottomTabNavigator();

export function DoctorTabNavigator() {
  const c = usePalette();
  // Respect the device's bottom safe-area inset (Android gesture/nav bar,
  // iOS home indicator) so the tab bar never sits under the system buttons.
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.background,
          borderTopColor: c.border,
          height: 64 + bottomInset,
          paddingBottom: bottomInset + 8,
          paddingTop: 8,
        },
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.text,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DoctorDashboardScreen}
        options={{
          // The screen has its own purple header.
          headerShown: false,
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={DoctorConsultationsScreen}
        options={{
          // The screen has its own purple header.
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Stethoscope color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={DoctorProfileScreen}
        options={{
          // The screen's own purple header replaces the nav header bar.
          headerShown: false,
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
