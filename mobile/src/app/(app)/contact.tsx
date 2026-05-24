import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

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

export default function ContactScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const { data, loading, error, refetch } = useAsyncData(
    useCallback((signal) => api.getAbout(token, signal), [token]),
  );

  if (loading) return <Loading label="Loading…" />;
  if (error || !data) return <ErrorView message={error ?? 'No data'} onRetry={refetch} />;

  const c = data.contact;
  const rows = [
    { icon: 'call-outline' as const, label: 'Phone', value: c.phone, url: `tel:${c.phone.replace(/\s/g, '')}` },
    { icon: 'mail-outline' as const, label: 'Email', value: c.email, url: `mailto:${c.email}` },
    {
      icon: 'location-outline' as const,
      label: 'Address',
      value: c.address,
      url: `https://maps.google.com/?q=${encodeURIComponent(c.address)}`,
    },
  ];

  return (
    <ScreenScroll onRefresh={refetch}>
      <ThemedText type="subtitle">Get in Touch</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Shree Coimbatore Gujarati Samaj
      </ThemedText>

      <Card style={styles.list}>
        {rows.map((r) => (
          <Pressable
            key={r.label}
            onPress={() => Linking.openURL(r.url).catch(() => {})}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
            <View style={[styles.icon, { backgroundColor: theme.tint }]}>
              <Ionicons name={r.icon} size={20} color="#fff" />
            </View>
            <View style={styles.rowText}>
              <ThemedText type="small" themeColor="textSecondary">
                {r.label}
              </ThemedText>
              <ThemedText type="small">{r.value}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.icon} />
          </Pressable>
        ))}
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
});
