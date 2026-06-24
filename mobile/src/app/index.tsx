import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { Loading } from '@/components/loading';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';

// Splash: redirect to login, change-password, or the app once the persisted session is restored.
export default function Index() {
  const { token, user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (!token) {
      router.replace('/login');
    } else if (user?.mustChangePassword) {
      router.replace('/change-password');
    } else {
      router.replace('/home');
    }
  }, [isReady, token, user, router]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <Loading label="Loading…" />
    </ThemedView>
  );
}
