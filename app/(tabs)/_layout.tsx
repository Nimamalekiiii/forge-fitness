import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { colors } from '../../src/theme';
import { tap } from '../../src/components/ui';

const icon =
  (name: React.ComponentProps<typeof Ionicons>['name'], active: React.ComponentProps<typeof Ionicons>['name']) =>
  ({ color, focused }: { color: string; focused: boolean }) =>
    <Ionicons name={focused ? active : name} size={24} color={color} />;

export default function TabsLayout() {
  const ready = useStore((s) => s.onboarded && !!s.profile && !!s.targets);
  if (!ready) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenListeners={{ tabPress: () => tap() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: 'rgba(10,13,18,0.98)',
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="workout" options={{ title: 'Workout', tabBarIcon: icon('barbell-outline', 'barbell') }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition', tabBarIcon: icon('nutrition-outline', 'nutrition') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: icon('stats-chart-outline', 'stats-chart') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}
