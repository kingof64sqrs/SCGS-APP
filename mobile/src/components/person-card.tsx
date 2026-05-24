import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { GoverningBodyPerson } from '@/api/types';
import { Spacing } from '@/constants/theme';
import { Avatar } from './avatar';
import { Card } from './card';
import { ThemedText } from './themed-text';

const PHOTO_SIZE = 64;

export function PersonCard({ person }: { person: GoverningBodyPerson }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!person.photoUrl && !failed;

  return (
    <Card style={styles.card}>
      {showPhoto ? (
        <Image
          source={{ uri: person.photoUrl }}
          style={styles.photo}
          contentFit="cover"
          transition={200}
          onError={() => setFailed(true)}
        />
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
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: '#00000010',
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
