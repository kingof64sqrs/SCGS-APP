import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

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

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: theme.backgroundSelected }]}>
        <Ionicons name={icon} size={18} color={theme.tint} />
      </View>
      <ThemedText type="small" style={styles.infoText}>
        {text}
      </ThemedText>
    </View>
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { data: ev, loading, error, refetch } = useAsyncData(
    useCallback(
      (signal) => (id ? api.getEvent(id, token, signal) : Promise.reject(new Error('Not found'))),
      [id, token],
    ),
  );

  if (loading) return <Loading label="Loading…" />;
  if (error || !ev) return <ErrorView message={error ?? 'Event not found'} onRetry={refetch} />;

  return (
    <ScreenScroll>
      <Card style={styles.card}>
        <EventBanner eventId={ev.id} hasBanner={ev.hasBanner} height={200} />
        <View style={styles.body}>
          <ThemedText type="subtitle">{ev.title}</ThemedText>

          <View style={styles.info}>
            {ev.eventDate ? <InfoRow icon="calendar-outline" text={ev.eventDate} /> : null}
            {ev.location ? <InfoRow icon="location-outline" text={ev.location} /> : null}
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.desc}>
            {ev.description}
          </ThemedText>
        </View>
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },
  body: { padding: Spacing.four, gap: Spacing.three },
  info: { gap: Spacing.two },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1 },
  desc: { lineHeight: 22 },
});
