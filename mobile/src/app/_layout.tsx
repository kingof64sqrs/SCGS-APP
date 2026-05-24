import 'react-native-gesture-handler';

import { useRouter, useSegments } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { ThemeModeProvider } from '@/context/theme-context';
import { useTheme } from '@/hooks/use-theme';

function RootNavigator() {
  const { token, isReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const theme = useTheme();
  const root = (segments as string[])[0];

  useEffect(() => {
    if (!isReady) return;
    if (!token) {
      // Not signed in: keep out of everything except login and the splash (index).
      if (root && root !== 'login') router.replace('/login');
    } else if (root === 'login') {
      // Signed in but sitting on login -> go home.
      router.replace('/home');
    }
  }, [token, isReady, root, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="member/[samajId]"
        options={{
          headerShown: true,
          title: 'Member Profile',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeModeProvider>
          <AuthProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </AuthProvider>
        </ThemeModeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
