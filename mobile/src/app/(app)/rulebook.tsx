import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { API_BASE_URL } from '@/api/config';
import { Card } from '@/components/card';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const LOGO = require('@/assets/images/scgs-logo.png');
const VIEW_URL = `${API_BASE_URL}/api/rulebook`;
const DOWNLOAD_URL = `${API_BASE_URL}/api/rulebook?download=1`;

export default function RuleBookScreen() {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  const view = async () => {
    setBusy(true);
    try {
      await WebBrowser.openBrowserAsync(VIEW_URL, {
        toolbarColor: theme.background,
        controlsColor: theme.tint,
      });
    } catch {
      Alert.alert('Could not open', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    try {
      await Linking.openURL(DOWNLOAD_URL);
    } catch {
      Alert.alert('Download failed', 'Please try again.');
    }
  };

  return (
    <ScreenScroll>
      <Card style={styles.hero}>
        <View style={[styles.iconWrap, { backgroundColor: `${theme.tint}18` }]}>
          <Image source={LOGO} style={styles.logo} contentFit="contain" />
        </View>
        <ThemedText type="subtitle" style={styles.center}>
          Rule Book
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          Shree Coimbatore Gujarati Samaj — AGM Rule Book (updated 18 Apr 2026). View it in the app
          or download a copy to your device.
        </ThemedText>
      </Card>

      <Pressable
        onPress={view}
        disabled={busy}
        style={({ pressed }) => [
          styles.primaryBtn,
          { backgroundColor: theme.tint, opacity: pressed || busy ? 0.85 : 1 },
        ]}>
        <Ionicons name="document-text-outline" size={20} color="#fff" />
        <ThemedText style={styles.primaryText}>View Rule Book</ThemedText>
      </Pressable>

      <Pressable
        onPress={download}
        style={({ pressed }) => [
          styles.secondaryBtn,
          { borderColor: theme.border, backgroundColor: theme.background, opacity: pressed ? 0.7 : 1 },
        ]}>
        <Ionicons name="download-outline" size={20} color={theme.tint} />
        <ThemedText type="smallBold" style={{ color: theme.tint }}>
          Download PDF
        </ThemedText>
      </Pressable>

      <ThemedText type="small" themeColor="textSecondary" style={[styles.center, styles.note]}>
        The rule book opens as a PDF. On most devices you can also save or share it from the viewer.
      </ThemedText>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 64, height: 64 },
  center: { textAlign: 'center' },
  primaryBtn: {
    height: 52,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: {
    height: 52,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  note: { marginTop: Spacing.two },
});
