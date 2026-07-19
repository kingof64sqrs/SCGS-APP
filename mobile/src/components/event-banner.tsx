import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { API_BASE_URL } from '@/api/config';
import { useTheme } from '@/hooks/use-theme';

/**
 * Event banner served from the backend (stored in MongoDB). Falls back to a
 * tinted placeholder with a calendar glyph when the event has no banner.
 */
export function EventBanner({
  eventId,
  hasBanner,
  height = 160,
}: {
  eventId: string;
  hasBanner: boolean;
  height?: number;
}) {
  const theme = useTheme();

  if (!hasBanner) {
    return (
      <View style={[styles.placeholder, { height, backgroundColor: theme.backgroundSelected }]}>
        <Ionicons name="calendar" size={40} color={theme.tint} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: `${API_BASE_URL}/api/events/${eventId}/banner` }}
      style={{ height, width: '100%', backgroundColor: theme.backgroundSelected }}
      contentFit="cover"
      transition={200}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
