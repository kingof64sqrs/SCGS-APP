import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { api } from '@/api/client';
import { Card } from '@/components/card';
import { ErrorView } from '@/components/error-view';
import { Loading } from '@/components/loading';
import { MemberPhoto } from '@/components/member-photo';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useAsyncData } from '@/hooks/use-async-data';
import { useTheme } from '@/hooks/use-theme';

function openUrl(url: string) {
  Linking.openURL(url).catch(() => {});
}

function ActionButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.action, { backgroundColor: color, opacity: pressed ? 0.85 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Ionicons name={icon} size={22} color="#fff" />
      <ThemedText style={styles.actionLabel}>{label}</ThemedText>
    </Pressable>
  );
}

function DetailRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.detailRow,
        !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      <View style={[styles.detailIcon, { backgroundColor: theme.backgroundSelected }]}>
        <Ionicons name={icon} size={18} color={theme.tint} />
      </View>
      <View style={styles.detailText}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="small">{value}</ThemedText>
      </View>
    </View>
  );
}

export default function MemberDetailScreen() {
  const theme = useTheme();
  const { samajId } = useLocalSearchParams<{ samajId: string }>();
  const { token } = useAuth();
  const { data: member, loading, error, refetch } = useAsyncData(
    useCallback((signal) => api.getMember(samajId, token, signal), [samajId, token]),
  );

  if (loading) return <Loading label="Loading…" />;
  if (error || !member) return <ErrorView message={error ?? 'Member not found'} onRetry={refetch} />;

  const telDigits = member.phone.replace(/[^0-9+]/g, '');
  const waDigits = member.phone.replace(/[^0-9]/g, '');

  return (
    <ScreenScroll>
      {/* Header */}
      <Card style={styles.headerCard}>
        <MemberPhoto samajId={member.samajId} name={member.name} size={120} />
        <ThemedText type="subtitle" style={styles.name}>
          {member.name}
        </ThemedText>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small" style={{ color: theme.tint }}>
              {member.samajId}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.tint }]}>
            <Ionicons name="water" size={13} color="#fff" />
            <ThemedText type="small" style={styles.bloodText}>
              {member.bloodGroup}
            </ThemedText>
          </View>
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <ActionButton icon="call" label="Call" color="#16A34A" onPress={() => openUrl(`tel:${telDigits}`)} />
        <ActionButton
          icon="logo-whatsapp"
          label="WhatsApp"
          color="#25D366"
          onPress={() => openUrl(`https://wa.me/${waDigits}`)}
        />
        <ActionButton
          icon="mail"
          label="Email"
          color={theme.tint}
          onPress={() => openUrl(`mailto:${member.email}`)}
        />
      </View>

      {/* Details */}
      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Contact Details
      </ThemedText>
      <Card style={styles.detailsCard}>
        <DetailRow icon="call-outline" label="Phone" value={member.phone} />
        <DetailRow icon="mail-outline" label="Email" value={member.email} />
        <DetailRow icon="location-outline" label="Address" value={member.address} last />
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  name: { textAlign: 'center' },
  badges: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  bloodText: { color: '#fff', fontWeight: '700' },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  actionLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionTitle: { marginTop: Spacing.two },
  detailsCard: { padding: 0, overflow: 'hidden' },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: { flex: 1, gap: 2 },
});
