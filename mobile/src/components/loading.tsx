import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { LottieAnim } from './lottie-anim';
import { ThemedText } from './themed-text';

const LOADING = require('@/assets/lottie/loading.json');

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.container}>
      <LottieAnim source={LOADING} ratio={0.55} minSize={140} maxSize={220} />
      {label ? (
        <ThemedText themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
    </View>
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
