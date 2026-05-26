import type { ConfigContext, ExpoConfig } from 'expo/config';

const DEFAULT_API_URL = 'https://three-superior-arc-chief.trycloudflare.com';

function normalizeApiUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/$/, '');
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL) ?? DEFAULT_API_URL;

  return {
    ...config,
    extra: {
      ...config.extra,
      scgsApiUrl: apiUrl,
    },
  } as ExpoConfig;
};