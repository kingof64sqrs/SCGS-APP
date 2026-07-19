import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { EventItem } from '@/api/types';
import { EventBanner } from '@/components/event-banner';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const AUTO_SCROLL_MS = 3000;

/**
 * Horizontally auto-scrolling carousel of events for the Home screen.
 * Advances one card every few seconds and loops back to the start. Manual
 * swiping is respected (auto-scroll pauses briefly while dragging).
 */
export function EventTicker({ events }: { events: EventItem[] }) {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const [paused, setPaused] = useState(false);

  const cardWidth = Math.min(300, width - Spacing.four * 2 - Spacing.three);
  const step = cardWidth + Spacing.three;

  useEffect(() => {
    if (events.length <= 1 || paused) return;
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % events.length;
      indexRef.current = next;
      scrollRef.current?.scrollTo({ x: next * step, animated: true });
    }, AUTO_SCROLL_MS);
    return () => clearInterval(timer);
  }, [events.length, paused, step]);

  if (events.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold">Events &amp; Updates</ThemedText>
        <Pressable onPress={() => router.push('/events')} hitSlop={8} style={styles.seeAll}>
          <ThemedText type="small" style={{ color: theme.tint }}>
            See all
          </ThemedText>
          <Ionicons name="chevron-forward" size={14} color={theme.tint} />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={step}
        onScrollBeginDrag={() => setPaused(true)}
        onMomentumScrollEnd={(e) => {
          indexRef.current = Math.round(e.nativeEvent.contentOffset.x / step);
          setPaused(false);
        }}
        contentContainerStyle={styles.track}>
        {events.map((ev) => (
          <Pressable
            key={ev.id}
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: ev.id } })}
            style={({ pressed }) => [
              styles.card,
              {
                width: cardWidth,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <EventBanner eventId={ev.id} hasBanner={ev.hasBanner} height={120} />
            <View style={styles.cardBody}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {ev.title}
              </ThemedText>
              {ev.eventDate ? (
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={13} color={theme.tint} />
                  <ThemedText type="small" style={{ color: theme.tint }} numberOfLines={1}>
                    {ev.eventDate}
                  </ThemedText>
                </View>
              ) : null}
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.desc}>
                {ev.description}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  track: { gap: Spacing.three, paddingRight: Spacing.one },
  card: {
    borderRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardBody: { padding: Spacing.three, gap: Spacing.one },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  desc: { marginTop: 2, lineHeight: 18 },
});
