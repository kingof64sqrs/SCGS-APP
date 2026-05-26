import Constants from 'expo-constants';

const DEFAULT_API_URL = 'https://three-superior-arc-chief.trycloudflare.com';

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
  const fromConfig = Constants.expoConfig?.extra?.scgsApiUrl;
  if (typeof fromConfig === 'string' && fromConfig.trim()) {
    return fromConfig.replace(/\/$/, '');
  }

  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return DEFAULT_API_URL;
}

export const API_BASE_URL = resolveBaseUrl();
