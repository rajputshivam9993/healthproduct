import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CalendarDays, Search, User } from 'lucide-react-native';
import { PatientHomeScreen } from '../screens/patient/home-screen';
import { PatientAppointmentsScreen } from '../screens/patient/appointments-screen';
import { PatientProfileScreen } from '../screens/patient/profile-screen';
import { usePalette } from '../theme/theme-context';

// Bottom tabs rendered for PATIENT users (Patient_Tab_Navigator).
const Tab = createBottomTabNavigator();

export function PatientTabNavigator() {
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
        name="Find"
        component={PatientHomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Search color={color} size={size} /> }}
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
