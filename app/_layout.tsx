import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useHydrated } from '../src/store/useStore';
import { colors } from '../src/theme';

export default function RootLayout() {
  const hydrated = useHydrated();
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {!hydrated ? (
        <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding/index" options={{ animation: 'fade' }} />
          <Stack.Screen name="onboarding/setup" />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="workout/active" options={{ gestureEnabled: false }} />
          <Stack.Screen name="workout/summary" options={{ presentation: 'modal', gestureEnabled: false }} />
          <Stack.Screen name="nutrition/scan" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="coach" options={{ presentation: 'modal' }} />
          <Stack.Screen name="progress/log-body" options={{ presentation: 'modal' }} />
        </Stack>
      )}
    </SafeAreaProvider>
  );
}
