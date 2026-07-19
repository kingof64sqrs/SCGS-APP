import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import { Card } from '@/components/card';
import { ErrorView } from '@/components/error-view';
import { EventBanner } from '@/components/event-banner';
import { Loading } from '@/components/loading';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useAsyncData } from '@/hooks/use-async-data';
import { useTheme } from '@/hooks/use-theme';

export default function EventsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { token } = useAuth();
  const { data, loading, refreshing, error, refetch } = useAsyncData(
    useCallback((signal) => api.getEvents(token, signal), [token]),
  );

  if (loading) return <Loading label="Loading events…" />;
  if (error || !data) return <ErrorView message={error ?? 'No data'} onRetry={refetch} />;

  if (data.length === 0) {
    return (
      <ScreenScroll onRefresh={refetch} refreshing={refreshing}>
        <View style={styles.emptyWrap}>
          <Ionicons name="calendar-outline" size={56} color={theme.textSecondary} />
          <ThemedText type="smallBold">No events yet</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Upcoming events and updates will appear here.
          </ThemedText>
        </View>
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll onRefresh={refetch} refreshing={refreshing}>
      {data.map((ev) => (
        <Pressable
          key={ev.id}
          onPress={() => router.push({ pathname: '/event/[id]', params: { id: ev.id } })}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Card style={styles.card}>
            <EventBanner eventId={ev.id} hasBanner={ev.hasBanner} height={150} />
            <View style={styles.body}>
              <ThemedText type="smallBold" numberOfLines={2}>
                {ev.title}
              </ThemedText>
              {ev.eventDate ? (
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color={theme.tint} />
                  <ThemedText type="small" style={{ color: theme.tint }}>
                    {ev.eventDate}
                  </ThemedText>
                </View>
              ) : null}
              {ev.location ? (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={theme.icon} />
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {ev.location}
                  </ThemedText>
                </View>
              ) : null}
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.desc}>
                {ev.description}
              </ThemedText>
            </View>
          </Card>
        </Pressable>
      ))}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },
  body: { padding: Spacing.three, gap: Spacing.one },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  desc: { marginTop: Spacing.one, lineHeight: 20 },
  emptyWrap: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.six },
  center: { textAlign: 'center' },
});
