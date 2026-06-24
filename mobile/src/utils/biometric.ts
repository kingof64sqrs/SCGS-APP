import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthUser } from '@/api/types';

const BIO_FLAG_KEY = 'scgs.bio.enabled';
const SECURE_SESSION_KEY = 'scgs.bio.session';

export type BiometricKind = 'fingerprint' | 'face' | 'iris' | 'biometrics';

/** Whether the device has hardware + at least one enrolled biometric. */
export async function biometricAvailable(): Promise<{
  available: boolean;
  kind: BiometricKind;
}> {
  if (Platform.OS === 'web') return { available: false, kind: 'biometrics' };
  try {
    const [hasHw, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    let kind: BiometricKind = 'biometrics';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) kind = 'face';
    else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) kind = 'fingerprint';
    else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) kind = 'iris';
    return { available: hasHw && enrolled, kind };
  } catch {
    return { available: false, kind: 'biometrics' };
  }
}

/** Whether the user has opted in to biometric login. */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(BIO_FLAG_KEY)) === '1';
  } catch {
    return false;
  }
}

/** Save the session in SecureStore (only used when biometric is enabled). */
export async function storeBiometricSession(token: string, user: AuthUser): Promise<void> {
  const payload = JSON.stringify({ token, user });
  await SecureStore.setItemAsync(SECURE_SESSION_KEY, payload, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await AsyncStorage.setItem(BIO_FLAG_KEY, '1');
}

/** Prompt biometrics; on success return the saved session (or null). */
export async function unlockBiometricSession(
  prompt: string,
): Promise<{ token: string; user: AuthUser } | null> {
  if (Platform.OS === 'web') return null;
  const enabled = await isBiometricEnabled();
  if (!enabled) return null;
  const stored = await SecureStore.getItemAsync(SECURE_SESSION_KEY);
  if (!stored) return null;

  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    fallbackLabel: 'Use password',
    disableDeviceFallback: false,
  });
  if (!res.success) return null;

  try {
    return JSON.parse(stored) as { token: string; user: AuthUser };
  } catch {
    return null;
  }
}

/** Remove all biometric data. */
export async function clearBiometric(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(BIO_FLAG_KEY),
    SecureStore.deleteItemAsync(SECURE_SESSION_KEY).catch(() => {}),
  ]);
}

/** Human label for the bio kind. */
export function bioLabel(kind: BiometricKind): string {
  switch (kind) {
    case 'face':
      return 'Face ID';
    case 'iris':
      return 'Iris';
    case 'fingerprint':
      return 'Fingerprint';
    default:
      return 'Biometric login';
  }
}
