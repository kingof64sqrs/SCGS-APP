import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import { ErrorView } from '@/components/error-view';
import { Loading } from '@/components/loading';
import { PersonCard } from '@/components/person-card';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useAsyncData } from '@/hooks/use-async-data';

export default function GoverningBodyScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { data, loading, refreshing, error, refetch } = useAsyncData(
    useCallback((signal) => api.getGoverningBody(token, signal), [token]),
  );

  if (loading) return <Loading label="Loading…" />;
  if (error || !data) return <ErrorView message={error ?? 'No data'} onRetry={refetch} />;

  return (
    <ScreenScroll onRefresh={refetch} refreshing={refreshing}>
      {data.map((group) => (
        <View key={group.group} style={styles.group}>
          <ThemedText type="smallBold" style={styles.groupTitle}>
            {group.group}
          </ThemedText>
          {group.members.map((person, i) => (
            <PersonCard
              key={`${group.group}-${i}`}
              person={person}
              onPress={
                person.samajId
                  ? () => router.push({ pathname: '/member/[samajId]', params: { samajId: person.samajId! } })
                  : undefined
              }
            />
          ))}
        </View>
      ))}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.three },
  groupTitle: { marginTop: Spacing.two },
});
