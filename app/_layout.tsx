import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { AppProvider } from '../src/appContext';
import { colors } from '../src/ui';
export default function Layout() {
  return <AppProvider><StatusBar style="light" /><Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: colors.panel, borderTopColor: colors.edge }, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted }}><Tabs.Screen name="index" options={{ title: 'Plan', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>≡</Text> }} /><Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>···</Text> }} /><Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙</Text> }} /></Tabs></AppProvider>;
}
