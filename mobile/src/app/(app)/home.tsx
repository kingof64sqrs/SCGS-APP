import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { api } from '@/api/client';
import { ErrorView } from '@/components/error-view';
import { EventTicker } from '@/components/event-ticker';
import { Loading } from '@/components/loading';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useAsyncData } from '@/hooks/use-async-data';
import { useTheme } from '@/hooks/use-theme';

const LOGO = require('@/assets/images/scgs-logo.png');
const MAPS_URL = 'https://maps.app.goo.gl/E7RJxR7uTuniNLjg6';

const COLS = 3;
const GRID_GAP = Spacing.two;
const SCREEN_PADDING = Spacing.four * 2; // ScreenScroll padding on both sides

type QuickLink = {
  href: '/members' | '/governing-body' | '/events' | '/rulebook' | '/about' | '/facilities' | '/contact';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const QUICK_LINKS: QuickLink[] = [
  { href: '/members', label: 'Members', icon: 'people-outline' },
  { href: '/governing-body', label: 'Governing Body', icon: 'ribbon-outline' },
  { href: '/events', label: 'Events', icon: 'calendar-outline' },
  { href: '/rulebook', label: 'Rule Book', icon: 'document-text-outline' },
  { href: '/about', label: 'About Us', icon: 'information-circle-outline' },
  { href: '/facilities', label: 'Facilities', icon: 'business-outline' },
  { href: '/contact', label: 'Contact', icon: 'call-outline' },
];

// Number of grid rows needed to show every quick link.
const GRID_ROWS = Math.ceil(QUICK_LINKS.length / 3);

function factIcon(label: string): keyof typeof Ionicons.glyphMap {
  const l = label.toLowerCase();
  if (l.includes('location') || l.includes('address')) return 'location-outline';
  if (l.includes('area') || l.includes('building')) return 'business-outline';
  if (l.includes('member')) return 'people-outline';
  return 'information-circle-outline';
}

function isLocation(label: string) {
  const l = label.toLowerCase();
  return l.includes('location') || l.includes('address') || l.includes('venue');
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { user, token } = useAuth();

  // Exact card width: screen - padding - all gaps between columns
  const cardWidth = (screenWidth - SCREEN_PADDING - GRID_GAP * (COLS - 1)) / COLS;

  const { data: about, loading, error, refetch } = useAsyncData(
    useCallback((signal) => api.getAbout(token, signal), [token]),
  );
  const { data: events } = useAsyncData(
    useCallback((signal) => api.getEvents(token, signal), [token]),
  );

  if (loading) return <Loading label="Loading…" />;
  if (error || !about) return <ErrorView message={error ?? 'No data'} onRetry={refetch} />;

  const heroStats = about.facts.slice(0, 2);
  const detailFacts = about.facts.slice(2);

  return (
    <ScreenScroll onRefresh={refetch}>

      {/* ── Hero banner ─────────────────────────────────────────── */}
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={[styles.decoBubble, styles.decoBubbleLarge, { backgroundColor: theme.tint }]} />
        <View style={[styles.decoBubble, styles.decoBubbleSmall, { backgroundColor: theme.tint }]} />

        <View style={styles.heroContent}>
          <View style={[styles.logoRing, { borderColor: `${theme.tint}40` }]}>
            <Image source={LOGO} style={styles.logo} contentFit="contain" />
          </View>
          <View style={styles.heroText}>
            <ThemedText type="small" themeColor="textSecondary">
              Welcome{user ? `, ${user.name.split(' ')[0]}` : ''}
            </ThemedText>
            <ThemedText style={[styles.heroTitle, { color: theme.text }]}>
              Shree Coimbatore{'\n'}Gujarati Samaj
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Charity &amp; Service · Coimbatore
            </ThemedText>
          </View>

          {heroStats.length > 0 ? (
            <View style={styles.statsPills}>
              {heroStats.map((fact) => (
                <View
                  key={fact.label}
                  style={[styles.pill, { backgroundColor: `${theme.tint}18`, borderColor: `${theme.tint}30` }]}>
                  <ThemedText style={[styles.pillValue, { color: theme.tint }]} numberOfLines={1}>
                    {fact.value}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.pillLabel}>
                    {fact.label}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Complete your profile CTA ───────────────────────────── */}
      <Pressable
        onPress={() => router.push('/edit-profile')}
        style={({ pressed }) => [
          styles.profileCta,
          { backgroundColor: theme.tint, opacity: pressed ? 0.9 : 1 },
        ]}>
        <View style={styles.ctaIcon}>
          <Ionicons name="person-circle-outline" size={26} color="#fff" />
        </View>
        <View style={styles.ctaText}>
          <ThemedText style={styles.ctaTitle}>Complete your profile</ThemedText>
          <ThemedText style={styles.ctaSub} numberOfLines={2}>
            Add your photo, WhatsApp, family &amp; more so members can reach you.
          </ThemedText>
        </View>
        <Ionicons name="arrow-forward-circle" size={24} color="#fff" />
      </Pressable>

      {/* ── Events & Updates ────────────────────────────────────── */}
      {events && events.length > 0 ? <EventTicker events={events} /> : null}

      {/* ── Quick Access ────────────────────────────────────────── */}
      <View>
        <ThemedText type="smallBold" style={styles.sectionTitle}>Quick Access</ThemedText>
        {/* Render rows manually so every item has an exact pixel width — no flex-wrap rounding errors */}
        {Array.from({ length: GRID_ROWS }, (_, row) => row).map((row) => (
          <View key={row} style={[styles.gridRow, row > 0 && { marginTop: GRID_GAP }]}>
            {QUICK_LINKS.slice(row * COLS, row * COLS + COLS).map((link) => (
              <Pressable
                key={link.href}
                onPress={() => router.push(link.href)}
                style={({ pressed }) => [{ width: cardWidth, opacity: pressed ? 0.65 : 1 }]}>
                <View style={[styles.linkCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <View style={[styles.linkIcon, { backgroundColor: `${theme.tint}18` }]}>
                    <Ionicons name={link.icon} size={20} color={theme.tint} />
                  </View>
                  <ThemedText type="small" style={styles.linkLabel} numberOfLines={2}>
                    {link.label}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      {/* ── At a Glance ─────────────────────────────────────────── */}
      {detailFacts.length > 0 ? (
        <View>
          <ThemedText type="smallBold" style={styles.sectionTitle}>At a Glance</ThemedText>
          <View style={[styles.glanceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {detailFacts.map((fact, i) => {
              const locFact = isLocation(fact.label);
              const Row = locFact ? Pressable : View;
              const rowProps = locFact
                ? {
                    onPress: () => Linking.openURL(MAPS_URL),
                    style: ({ pressed }: { pressed: boolean }) => [
                      styles.glanceRow,
                      i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
                      { opacity: pressed ? 0.7 : 1 },
                    ],
                  }
                : {
                    style: [
                      styles.glanceRow,
                      i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
                    ],
                  };

              return (
                // @ts-ignore — Row is conditionally View or Pressable
                <Row key={fact.label} {...rowProps}>
                  <View style={[styles.glanceIcon, { backgroundColor: locFact ? `${theme.tint}25` : `${theme.tint}18` }]}>
                    <Ionicons name={factIcon(fact.label)} size={16} color={theme.tint} />
                  </View>
                  <View style={styles.glanceText}>
                    <ThemedText type="small" themeColor="textSecondary">{fact.label}</ThemedText>
                    <ThemedText
                      type="small"
                      style={locFact ? { color: theme.tint, textDecorationLine: 'underline' } : undefined}>
                      {fact.value}
                    </ThemedText>
                  </View>
                  {locFact ? (
                    <Ionicons name="open-outline" size={15} color={theme.tint} />
                  ) : null}
                </Row>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* ── About snippet ───────────────────────────────────────── */}
      <View>
        <ThemedText type="smallBold" style={styles.sectionTitle}>About the Samaj</ThemedText>
        <View style={[styles.aboutCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.snippet}>
            {about.paragraphs[0]}
          </ThemedText>
          <Pressable
            onPress={() => router.push('/about')}
            style={({ pressed }) => [styles.readMore, { opacity: pressed ? 0.6 : 1 }]}>
            <ThemedText type="smallBold" style={{ color: theme.tint }}>Read more</ThemedText>
            <Ionicons name="arrow-forward" size={15} color={theme.tint} />
          </Pressable>
        </View>
      </View>

    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  /* ── Hero ──────────────────────────────────────────────────── */
  hero: {
    borderRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  decoBubble: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.07,
  },
  decoBubbleLarge: { width: 200, height: 200, top: -60, right: -60 },
  decoBubbleSmall: { width: 120, height: 120, bottom: -40, left: -30 },
  heroContent: {
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  logo: { width: 56, height: 56 },
  heroText: { gap: 4 },
  heroTitle: { fontSize: 20, fontWeight: '700', lineHeight: 26, marginTop: 2 },
  statsPills: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    alignItems: 'center',
    minWidth: 100,
  },
  pillValue: { fontSize: 18, fontWeight: '700', lineHeight: 22 },
  pillLabel: { marginTop: 1 },

  /* ── Quick Access ──────────────────────────────────────────── */
  sectionTitle: { marginBottom: Spacing.two },
  profileCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { flex: 1, gap: 1 },
  ctaTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ctaSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 16 },
  gridRow: { flexDirection: 'row', gap: GRID_GAP },
  linkCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 88,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: { textAlign: 'center', lineHeight: 16, fontSize: 12 },

  /* ── At a Glance ───────────────────────────────────────────── */
  glanceCard: {
    borderRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  glanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  glanceIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  glanceText: { flex: 1, gap: 2 },

  /* ── About ─────────────────────────────────────────────────── */
  aboutCard: {
    borderRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  snippet: { lineHeight: 22 },
  readMore: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
