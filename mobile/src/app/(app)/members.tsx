import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { api } from '@/api/client';
import type { Member } from '@/api/types';
import { ErrorView } from '@/components/error-view';
import { Loading } from '@/components/loading';
import { LottieAnim } from '@/components/lottie-anim';
import { MemberPhoto } from '@/components/member-photo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useAsyncData } from '@/hooks/use-async-data';
import { useTheme } from '@/hooks/use-theme';

const EMPTY = require('@/assets/lottie/empty-search.json');

function MemberRow({ member, onPress }: { member: Member; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
      ]}>
      <MemberPhoto samajId={member.samajId} name={member.name} size={52} />
      <View style={styles.rowText}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {member.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {member.samajId}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.icon} />
    </Pressable>
  );
}

export default function MembersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { token } = useAuth();
  const { data, loading, refreshing, error, refetch } = useAsyncData(
    useCallback((signal) => api.getMembers(token, signal), [token]),
  );
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.samajId.toLowerCase().includes(q) ||
        m.bloodGroup.toLowerCase().includes(q),
    );
  }, [data, query]);

  if (loading) return <Loading label="Loading members…" />;
  if (error || !data) return <ErrorView message={error ?? 'No data'} onRetry={refetch} />;

  return (
    <ThemedView style={styles.root}>
      <FlatList
        data={filtered}
        keyExtractor={(m) => m.samajId}
        renderItem={({ item }) => (
          <MemberRow
            member={item}
            onPress={() => router.push({ pathname: '/member/[samajId]', params: { samajId: item.samajId } })}
          />
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={refetch}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View
              style={[
                styles.search,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <Ionicons name="search" size={18} color={theme.icon} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by name, ID, blood group…"
                placeholderTextColor={theme.textSecondary}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={theme.icon} />
                </Pressable>
              ) : null}
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.count}>
              {filtered.length} member{filtered.length === 1 ? '' : 's'}
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <LottieAnim source={EMPTY} ratio={0.6} minSize={160} maxSize={240} />
            <ThemedText type="smallBold" style={styles.empty}>
              No matches
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              No members match “{query}”.
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: Spacing.four,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  count: { marginLeft: Spacing.one },
  empty: { textAlign: 'center' },
  emptyWrap: { alignItems: 'center', gap: Spacing.one, marginTop: Spacing.four },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
  },
  rowText: { flex: 1, gap: 2 },
});
