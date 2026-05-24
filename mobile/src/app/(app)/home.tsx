import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import { Card } from '@/components/card';
import { ErrorView } from '@/components/error-view';
import { Loading } from '@/components/loading';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useAsyncData } from '@/hooks/use-async-data';
import { useTheme } from '@/hooks/use-theme';

const LOGO = require('@/assets/images/scgs-logo.png');

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

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, token } = useAuth();
  const { data: about, loading, error, refetch } = useAsyncData(
    useCallback((signal) => api.getAbout(token, signal), [token]),
  );

  if (loading) return <Loading label="Loading…" />;
  if (error || !about) return <ErrorView message={error ?? 'No data'} onRetry={refetch} />;

  return (
    <ScreenScroll onRefresh={refetch}>
      {/* Hero */}
      <Card style={styles.hero}>
        <Image source={LOGO} style={styles.logo} contentFit="contain" />
        <View style={styles.heroText}>
          <ThemedText type="small" themeColor="textSecondary">
            Welcome{user ? `, ${user.name}` : ''}
          </ThemedText>
          <ThemedText type="smallBold">Shree Coimbatore Gujarati Samaj</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Charity &amp; Service · Coimbatore
          </ThemedText>
        </View>
      </Card>

      {/* Stats */}
      <View style={styles.statsRow}>
        {about.facts.slice(0, 3).map((fact) => (
          <Card key={fact.label} style={styles.statCard}>
            <ThemedText type="subtitle" style={{ color: theme.tint }}>
              {fact.value}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
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
              <ThemedText type="small" style={styles.linkLabel}>
                {link.label}
              </ThemedText>
            </Card>
          </Pressable>
        ))}
      </View>

      {/* About snippet */}
      <ThemedText type="smallBold" style={styles.sectionTitle}>
        About the Samaj
      </ThemedText>
      <Card style={{ gap: Spacing.three }}>
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
  logo: { width: 64, height: 64 },
  heroText: { flex: 1, gap: 2 },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  statLabel: { textAlign: 'center' },
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
    gap: Spacing.two,
    padding: Spacing.three,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: { textAlign: 'center' },
  snippet: { lineHeight: 22 },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
