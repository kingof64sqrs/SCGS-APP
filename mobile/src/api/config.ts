import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_URL = 'https://sellers-afterwards-pacific-chronicles.trycloudflare.com';

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
  // On the web build the page is served by a host that reverse-proxies /api to
  // the backend, so talk to our own origin: no CORS, and nothing to change when
  // a tunnel hostname rotates. An explicit EXPO_PUBLIC_API_URL still wins.
  if (Platform.OS === 'web' && !process.env.EXPO_PUBLIC_API_URL) return '';

  const fromConfig = Constants.expoConfig?.extra?.scgsApiUrl;
  if (typeof fromConfig === 'string' && fromConfig.trim()) {
    return fromConfig.replace(/\/$/, '');
  }

  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return DEFAULT_API_URL;
}

export const API_BASE_URL = resolveBaseUrl();
