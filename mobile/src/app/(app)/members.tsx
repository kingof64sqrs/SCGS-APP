import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

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
import { useTheme } from '@/hooks/use-theme';

const EMPTY = require('@/assets/lottie/empty-search.json');

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

function MemberRow({ member, onPress }: { member: Member; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: pressed ? 0.7 : 1,
        },
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

  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  const [items, setItems] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce typing into `query` -> `activeQuery` (which actually triggers a fetch).
  useEffect(() => {
    const t = setTimeout(() => setActiveQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Cancel any in-flight request when the query/auth changes or the screen unmounts.
  const controllerRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (
      nextPage: number,
      q: string,
      mode: 'replace' | 'append',
    ) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      if (mode === 'replace') {
        if (items.length === 0) setInitialLoading(true);
        else setRefreshing(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const res = await api.getMembersPage(
          { page: nextPage, limit: PAGE_SIZE, q: q || undefined },
          token,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setItems((prev) => (mode === 'append' ? [...prev, ...res.items] : res.items));
        setPage(res.page);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Could not load members');
      } finally {
        if (controller.signal.aborted) return;
        setInitialLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    // We intentionally exclude `items` here — adding it would re-run on every
    // append and abort the very request we just kicked off.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token],
  );

  // Initial load + reload whenever the active (debounced) query changes.
  useEffect(() => {
    void fetchPage(1, activeQuery, 'replace');
    return () => controllerRef.current?.abort();
  }, [activeQuery, fetchPage]);

  const onRefresh = useCallback(() => {
    void fetchPage(1, activeQuery, 'replace');
  }, [activeQuery, fetchPage]);

  const onEndReached = useCallback(() => {
    if (loadingMore || refreshing || initialLoading) return;
    if (page >= totalPages) return;
    void fetchPage(page + 1, activeQuery, 'append');
  }, [loadingMore, refreshing, initialLoading, page, totalPages, activeQuery, fetchPage]);

  if (initialLoading && items.length === 0) return <Loading label="Loading members…" />;
  if (error && items.length === 0)
    return <ErrorView message={error} onRetry={() => fetchPage(1, activeQuery, 'replace')} />;

  return (
    <ThemedView style={styles.root}>
      <FlatList
        data={items}
        keyExtractor={(m) => m.samajId}
        renderItem={({ item }) => (
          <MemberRow
            member={item}
            onPress={() =>
              router.push({
                pathname: '/member/[samajId]',
                params: { samajId: item.samajId },
              })
            }
          />
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReachedThreshold={0.5}
        onEndReached={onEndReached}
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
                placeholder="Search by name, ID, phone…"
                placeholderTextColor={theme.textSecondary}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={theme.icon} />
                </Pressable>
              ) : null}
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.count}>
              {activeQuery
                ? `${total} match${total === 1 ? '' : 'es'} for “${activeQuery}”`
                : `${total.toLocaleString()} member${total === 1 ? '' : 's'}`}
            </ThemedText>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={theme.tint} />
            </View>
          ) : page >= totalPages && items.length > 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.footerText}>
              End of list
            </ThemedText>
          ) : null
        }
        ListEmptyComponent={
          !initialLoading ? (
            <View style={styles.emptyWrap}>
              <LottieAnim source={EMPTY} ratio={0.6} minSize={160} maxSize={240} />
              <ThemedText type="smallBold" style={styles.empty}>
                No matches
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                {activeQuery
                  ? `No members match “${activeQuery}”.`
                  : 'No members yet.'}
              </ThemedText>
            </View>
          ) : null
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
  header: { gap: Spacing.two, marginBottom: Spacing.three },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
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
  footer: { paddingVertical: Spacing.three, alignItems: 'center' },
  footerText: { textAlign: 'center', paddingVertical: Spacing.three },
});
