import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import { Card } from '@/components/card';
import { ErrorView } from '@/components/error-view';
import { Loading } from '@/components/loading';
import { LottieAnim } from '@/components/lottie-anim';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useAsyncData } from '@/hooks/use-async-data';
import { useTheme } from '@/hooks/use-theme';

const LOGO = require('@/assets/images/scgs-logo.png');
const HERO = require('@/assets/lottie/home-hero.json');

type QuickLink = {
  href: '/members' | '/governing-body' | '/about' | '/facilities' | '/contact';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const QUICK_LINKS: QuickLink[] = [
  { href: '/members', label: 'Member Directory', icon: 'people-outline' },
  { href: '/governing-body', label: 'Governing Body', icon: 'ribbon-outline' },
  { href: '/about', label: 'About Us', icon: 'information-circle-outline' },
  { href: '/facilities', label: 'Facilities', icon: 'business-outline' },
  { href: '/contact', label: 'Contact Us', icon: 'call-outline' },
];

function factIcon(label: string): keyof typeof Ionicons.glyphMap {
  const l = label.toLowerCase();
  if (l.includes('location')) return 'location-outline';
  if (l.includes('area') || l.includes('building')) return 'business-outline';
  if (l.includes('member')) return 'people-outline';
  return 'calendar-outline';
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, token } = useAuth();
  const { data: about, loading, error, refetch } = useAsyncData(
    useCallback((signal) => api.getAbout(token, signal), [token]),
  );

  if (loading) return <Loading label="Loading…" />;
  if (error || !about) return <ErrorView message={error ?? 'No data'} onRetry={refetch} />;

  const heroStats = about.facts.slice(0, 2);
  const detailFacts = about.facts.slice(2);

  return (
    <ScreenScroll onRefresh={refetch}>
      {/* Hero animation */}
      <LottieAnim source={HERO} ratio={0.55} minSize={160} maxSize={240} />

      {/* Hero */}
      <Card style={styles.hero}>
        <Image source={LOGO} style={styles.logo} contentFit="contain" />
        <View style={styles.heroText}>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            Welcome{user ? `, ${user.name}` : ''}
          </ThemedText>
          <ThemedText type="smallBold">Shree Coimbatore Gujarati Samaj</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Charity &amp; Service · Coimbatore
          </ThemedText>
        </View>
      </Card>

      {/* Hero stats — short values only, never wrap */}
      <View style={styles.statsRow}>
        {heroStats.map((fact) => (
          <Card key={fact.label} style={styles.statCard}>
            <ThemedText
              style={[styles.statValue, { color: theme.tint }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}>
              {fact.value}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {fact.label}
            </ThemedText>
          </Card>
        ))}
      </View>

      {/* Quick links */}
      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Quick Links
      </ThemedText>
      <View style={styles.linksGrid}>
        {QUICK_LINKS.map((link) => (
          <Pressable
            key={link.href}
            onPress={() => router.push(link.href)}
            style={({ pressed }) => [styles.linkWrap, { opacity: pressed ? 0.7 : 1 }]}>
            <Card style={styles.linkCard}>
              <View style={[styles.linkIcon, { backgroundColor: theme.tint }]}>
                <Ionicons name={link.icon} size={22} color="#fff" />
              </View>
              <ThemedText type="small" style={styles.linkLabel} numberOfLines={2}>
                {link.label}
              </ThemedText>
            </Card>
          </Pressable>
        ))}
      </View>

      {/* At a glance — longer facts as wrap-friendly rows */}
      {detailFacts.length > 0 ? (
        <>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            At a Glance
          </ThemedText>
          <Card style={styles.glanceCard}>
            {detailFacts.map((fact, i) => (
              <View
                key={fact.label}
                style={[
                  styles.glanceRow,
                  i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
                ]}>
                <View style={[styles.glanceIcon, { backgroundColor: theme.backgroundSelected }]}>
                  <Ionicons name={factIcon(fact.label)} size={18} color={theme.tint} />
                </View>
                <View style={styles.glanceText}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {fact.label}
                  </ThemedText>
                  <ThemedText type="small">{fact.value}</ThemedText>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {/* About snippet */}
      <ThemedText type="smallBold" style={styles.sectionTitle}>
        About the Samaj
      </ThemedText>
      <Card style={styles.aboutCard}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.snippet}>
          {about.paragraphs[0]}
        </ThemedText>
        <Pressable onPress={() => router.push('/about')} style={styles.readMore}>
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            Read more
          </ThemedText>
          <Ionicons name="arrow-forward" size={16} color={theme.tint} />
        </Pressable>
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  logo: { width: 60, height: 60 },
  heroText: { flex: 1, gap: 2 },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.four,
  },
  statValue: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionTitle: { marginTop: Spacing.two },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  linkWrap: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  linkCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    minHeight: 108,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: { textAlign: 'center' },
  glanceCard: { padding: 0, overflow: 'hidden' },
  glanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  glanceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glanceText: { flex: 1, gap: 2 },
  aboutCard: { gap: Spacing.three },
  snippet: { lineHeight: 22 },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
