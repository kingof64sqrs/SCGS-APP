import { Loading } from '@/components/loading';
import { ThemedView } from '@/components/themed-view';

// Splash while the root navigator redirects to /login or /home based on auth.
export default function Index() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <Loading label="Loading…" />
    </ThemedView>
  );
}
