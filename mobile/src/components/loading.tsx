import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { LottieAnim } from './lottie-anim';
import { ThemedText } from './themed-text';

const LOADING = require('@/assets/lottie/loading.json');

export function Loading({ label }: { label?: string }) {
  return (
    <ThemedView style={styles.container}>
      <LottieAnim source={LOADING} ratio={0.55} minSize={140} maxSize={220} framed />
      {label ? (
        <ThemedText themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  label: { textAlign: 'center' },
});
