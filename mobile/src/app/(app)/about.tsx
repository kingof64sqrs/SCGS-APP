import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import { Card } from '@/components/card';
import { ErrorView } from '@/components/error-view';
import { IconRow } from '@/components/icon-row';
import { Loading } from '@/components/loading';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useAsyncData } from '@/hooks/use-async-data';
import { useTheme } from '@/hooks/use-theme';

export default function AboutScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const { data, loading, error, refetch } = useAsyncData(
    useCallback((signal) => api.getAbout(token, signal), [token]),
  );

  if (loading) return <Loading label="Loading…" />;
  if (error || !data) return <ErrorView message={error ?? 'No data'} onRetry={refetch} />;

  return (
    <ScreenScroll onRefresh={refetch}>
      <ThemedText type="subtitle">{data.title}</ThemedText>

      <View style={styles.facts}>
        {data.facts.map((fact) => (
          <Card key={fact.label} style={styles.fact}>
            <ThemedText type="smallBold" style={{ color: theme.tint }}>
              {fact.value}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.factLabel}>
              {fact.label}
            </ThemedText>
          </Card>
        ))}
      </View>

      <Card style={styles.block}>
        {data.paragraphs.map((p, i) => (
          <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.para}>
            {p}
          </ThemedText>
        ))}
      </Card>

      <ThemedText type="smallBold" style={styles.heading}>
        Facilities
      </ThemedText>
      <Card style={styles.list}>
        {data.facilities.map((f, i) => (
          <IconRow key={i} icon="checkmark-circle-outline" text={f} />
        ))}
      </Card>

      <ThemedText type="smallBold" style={styles.heading}>
        Services
      </ThemedText>
      <Card style={styles.list}>
        {data.services.map((s, i) => (
          <IconRow key={i} icon="medkit-outline" text={s} />
        ))}
      </Card>

      <ThemedText type="smallBold" style={styles.heading}>
        Contact
      </ThemedText>
      <Card style={styles.list}>
        <IconRow icon="location-outline" text={data.contact.address} />
        <IconRow icon="call-outline" text={data.contact.phone} />
        <IconRow icon="mail-outline" text={data.contact.email} />
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  fact: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  factLabel: {},
  block: { gap: Spacing.three },
  para: { lineHeight: 22 },
  heading: { marginTop: Spacing.two },
  list: { gap: Spacing.three },
});
