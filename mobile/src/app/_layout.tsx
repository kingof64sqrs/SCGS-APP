import 'react-native-gesture-handler';

import { useRouter, useSegments } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { ThemeModeProvider } from '@/context/theme-context';

function RootNavigator() {
  const { token, isReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    const onLogin = segments[0] === 'login';
    const inApp = segments[0] === '(app)';
    if (!token && !onLogin) {
      // Not signed in and outside the login screen -> go to login.
      router.replace('/login');
    } else if (token && !inApp) {
      // Signed in but not yet inside the app group -> go to home.
      router.replace('/home');
    }
  }, [token, isReady, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
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
