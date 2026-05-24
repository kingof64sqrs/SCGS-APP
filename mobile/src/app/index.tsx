import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { Loading } from '@/components/loading';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';

// Splash: redirect to the app or login once the persisted session is restored.
export default function Index() {
  const { token, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady) router.replace(token ? '/home' : '/login');
  }, [isReady, token, router]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <Loading label="Loading…" />
    </ThemedView>
  );
}
