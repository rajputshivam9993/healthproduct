import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CalendarDays, LayoutDashboard, Stethoscope, User } from 'lucide-react-native';
import { DoctorDashboardScreen } from '../screens/doctor/dashboard-screen';
import { DoctorCalendarScreen } from '../screens/doctor/calendar-screen';
import { DoctorConsultationsScreen } from '../screens/doctor/consultations-screen';
import { DoctorProfileScreen } from '../screens/doctor/profile-screen';
import { usePalette } from '../theme/theme-context';

// Bottom tabs rendered for DOCTOR users (Doctor_Tab_Navigator): Dashboard,
// Calendar, Consultations, Profile (Req 21.2).
const Tab = createBottomTabNavigator();

export function DoctorTabNavigator() {
  const c = usePalette();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.background, borderTopColor: c.border },
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.text,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DoctorDashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Calendar"
        component={DoctorCalendarScreen}
        options={{ tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Consultations"
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
