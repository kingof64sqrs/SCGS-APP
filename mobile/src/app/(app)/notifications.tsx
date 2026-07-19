import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import type { AppNotification } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useNotifications } from '@/context/notifications-context';
import { useTheme } from '@/hooks/use-theme';

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { items, unread, loading, refresh, markRead, markAllRead } = useNotifications();

  const onOpen = (n: AppNotification) => {
    if (!n.read) void markRead(n.id);
    if (n.type === 'event' && n.refId) {
      router.push({ pathname: '/event/[id]', params: { id: n.refId } });
    }
  };

  return (
    <ThemedView style={styles.root}>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.content}
        refreshing={loading}
        onRefresh={refresh}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
        ListHeaderComponent={
          items.length > 0 && unread > 0 ? (
            <Pressable onPress={markAllRead} style={styles.markAll} hitSlop={6}>
              <Ionicons name="checkmark-done" size={16} color={theme.tint} />
              <ThemedText type="small" style={{ color: theme.tint }}>
                Mark all as read ({unread})
              </ThemedText>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onOpen(item)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: item.read ? theme.background : theme.backgroundElement,
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: item.type === 'event' ? theme.tint : theme.backgroundSelected },
              ]}>
              <Ionicons
                name={item.type === 'event' ? 'calendar' : 'megaphone'}
                size={18}
                color={item.type === 'event' ? '#fff' : theme.tint}
              />
            </View>
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
                  {item.title}
                </ThemedText>
                {!item.read ? <View style={[styles.dot, { backgroundColor: theme.tint }]} /> : null}
              </View>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
                {item.body}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.time}>
                {timeAgo(item.createdAt)}
              </ThemedText>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-off-outline" size={52} color={theme.textSecondary} />
              <ThemedText type="smallBold">No notifications</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                Event alerts and announcements will show up here.
              </ThemedText>
            </View>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: Spacing.four,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-end',
    marginBottom: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  time: { marginTop: 2 },
  emptyWrap: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.six },
  center: { textAlign: 'center' },
});
