import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { GoverningBodyPerson } from '@/api/types';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Avatar } from './avatar';
import { Card } from './card';
import { MemberPhoto } from './member-photo';
import { ThemedText } from './themed-text';

const PHOTO_SIZE = 64;

export function PersonCard({
  person,
  onPress,
}: {
  person: GoverningBodyPerson;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const tappable = !!onPress && !!person.samajId;

  const inner = (
    <Card style={styles.card}>
      {person.samajId ? (
        <MemberPhoto samajId={person.samajId} name={person.name} size={PHOTO_SIZE} />
      ) : (
        <Avatar name={person.name} size={PHOTO_SIZE} />
      )}
      <View style={styles.text}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {person.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
          {person.position}
        </ThemedText>
      </View>
      {tappable ? <Ionicons name="chevron-forward" size={18} color={theme.icon} /> : null}
    </Card>
  );

  if (tappable) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
