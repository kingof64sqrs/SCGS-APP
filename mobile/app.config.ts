import type { ConfigContext, ExpoConfig } from 'expo/config';

const DEFAULT_API_URL = 'https://sellers-afterwards-pacific-chronicles.trycloudflare.com';

function normalizeApiUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/$/, '');
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL) ?? DEFAULT_API_URL;

  // The web build is served under a sub-path (see EXPO_WEB_BASE_URL in the
  // build script); native builds leave this unset.
  const baseUrl = process.env.EXPO_WEB_BASE_URL?.trim();

  return {
    ...config,
    extra: {
      ...config.extra,
      scgsApiUrl: apiUrl,
    },
    experiments: {
      ...config.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  } as ExpoConfig;
};