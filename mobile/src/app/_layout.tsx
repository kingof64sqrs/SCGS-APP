import 'react-native-gesture-handler';

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { NotificationsProvider } from '@/context/notifications-context';
import { ThemeModeProvider } from '@/context/theme-context';
import { useTheme } from '@/hooks/use-theme';

// Ensure the app always starts on the splash/index, not a dynamic route.
export const unstable_settings = { initialRouteName: 'index' };

function RootNavigator() {
  const { token, user, isReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const theme = useTheme();
  const root = (segments as string[])[0];

  useEffect(() => {
    if (!isReady) return;
    const onLogin = root === 'login';
    const onChangePassword = root === 'change-password';

    if (!token) {
      // Not signed in: keep out of everything except login and the splash (index).
      if (root && !onLogin) router.replace('/login');
      return;
    }

    if (user?.mustChangePassword) {
      // Signed in but the password is still the default → force the change.
      if (!onChangePassword) router.replace('/change-password');
      return;
    }

    // Signed in & password set → kick away from the login screen. We allow
    // voluntary visits to /change-password (it has its own Cancel/back action).
    if (onLogin) {
      router.replace('/home');
    }
  }, [token, user, isReady, root, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="(app)" />
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
      <Stack.Screen
        name="event/[id]"
        options={{
          headerShown: true,
          title: 'Event',
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
            <NotificationsProvider>
              <RootNavigator />
              <StatusBar style="auto" />
            </NotificationsProvider>
          </AuthProvider>
        </ThemeModeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
