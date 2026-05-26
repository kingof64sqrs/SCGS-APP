import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LottieAnim } from './lottie-anim';
import { ThemedText } from './themed-text';

const ERROR = require('@/assets/lottie/error.json');

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <LottieAnim source={ERROR} ratio={0.55} minSize={150} maxSize={240} />
      <ThemedText type="smallBold" style={styles.message}>
        {message}
      </ThemedText>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <ThemedText style={styles.buttonText}>Retry</ThemedText>
        </Pressable>
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
  message: { textAlign: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
