import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

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

export default function FacilitiesScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const { data, loading, error, refetch } = useAsyncData(
    useCallback((signal) => api.getFacilities(token, signal), [token]),
  );

  if (loading) return <Loading label="Loading…" />;
  if (error || !data) return <ErrorView message={error ?? 'No data'} onRetry={refetch} />;

  return (
    <ScreenScroll onRefresh={refetch}>
      {data.map((facility, i) => (
        <Card key={i} style={styles.card}>
          <View style={[styles.icon, { backgroundColor: theme.tint }]}>
            <Ionicons name="business-outline" size={22} color="#fff" />
          </View>
          <View style={styles.text}>
            <ThemedText type="smallBold">{facility.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.desc}>
              {facility.description}
            </ThemedText>
          </View>
        </Card>
      ))}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  desc: { lineHeight: 20 },
});
