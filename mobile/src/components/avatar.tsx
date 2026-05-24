import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

const PALETTE = ['#1E3A8A', '#0E7490', '#B91C1C', '#15803D', '#7C3AED', '#B45309', '#BE185D', '#0F766E'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colorFor(name) },
      ]}>
      <ThemedText style={[styles.text, { fontSize: size * 0.38 }]}>{getInitials(name)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
