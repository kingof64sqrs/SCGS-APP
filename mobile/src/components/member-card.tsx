import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { Member } from '@/api/types';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Avatar } from './avatar';
import { Card } from './card';
import { ThemedText } from './themed-text';

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={theme.icon} style={styles.infoIcon} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
        {text}
      </ThemedText>
    </View>
  );
}

export function MemberCard({ member }: { member: Member }) {
  const theme = useTheme();
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Avatar name={member.name} size={48} />
        <View style={styles.headerText}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {member.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.tint }}>
            {member.samajId}
          </ThemedText>
        </View>
        <View style={[styles.bloodBadge, { backgroundColor: theme.tint }]}>
          <ThemedText style={styles.bloodText}>{member.bloodGroup}</ThemedText>
        </View>
      </View>

      <View style={styles.info}>
        <InfoRow icon="call-outline" text={member.phone} />
        <InfoRow icon="mail-outline" text={member.email} />
        <InfoRow icon="location-outline" text={member.address} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  bloodBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
    minWidth: 40,
    alignItems: 'center',
  },
  bloodText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  info: {
    gap: Spacing.two,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
  },
});
