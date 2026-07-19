import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useNotifications } from '@/context/notifications-context';
import { useTheme } from '@/hooks/use-theme';

export function NotificationsBell() {
  const theme = useTheme();
  const router = useRouter();
  const { unread } = useNotifications();

  return (
    <Pressable
      onPress={() => router.push('/(app)/notifications')}
      style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.6 : 1 }]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `${unread} unread notifications` : 'Notifications'}>
      <Ionicons name="notifications-outline" size={24} color={theme.text} />
      {unread > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.tint }]}>
          <ThemedText style={styles.badgeText}>{unread > 99 ? '99+' : unread}</ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginRight: Spacing.three,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
