import { Platform } from 'react-native';

/**
 * Base URL of the SCGS backend API.
 *
 * Override at runtime with the EXPO_PUBLIC_API_URL env var (recommended for
 * physical devices — set it to your computer's LAN IP, e.g.
 * EXPO_PUBLIC_API_URL=http://192.168.1.20:4000).
 *
 * Defaults:
 *  - Android emulator: 10.0.2.2 maps to the host machine's localhost
 *  - iOS simulator / web: localhost
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  return 'http://localhost:4000';
}

export const API_BASE_URL = resolveBaseUrl();
