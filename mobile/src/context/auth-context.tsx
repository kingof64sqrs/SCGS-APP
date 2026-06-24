import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api } from '@/api/client';
import type { AuthUser } from '@/api/types';
import {
  biometricAvailable,
  clearBiometric,
  isBiometricEnabled,
  storeBiometricSession,
  unlockBiometricSession,
  type BiometricKind,
} from '@/utils/biometric';

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isReady: boolean;
  /** Bumped when the current user's photo changes, to bust image caches. */
  photoBust: number;
  /** Biometric login is set up on this device for the current account. */
  biometricEnabled: boolean;
  /** Device hardware/enrolment supports biometric login. */
  biometricSupported: boolean;
  /** What kind of biometric the device offers (Face ID, fingerprint…). */
  biometricKind: BiometricKind;
  signIn: (identifier: string, password: string) => Promise<void>;
  /** Prompt biometrics, then restore the cached session. Resolves true on success. */
  signInWithBiometric: () => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUser: (user: AuthUser) => Promise<void>;
  markPasswordChanged: () => Promise<void>;
  /** Save the current session behind biometrics. */
  enableBiometric: () => Promise<void>;
  /** Forget the cached session and bio flag. */
  disableBiometric: () => Promise<void>;
  bumpPhoto: () => void;
};

const TOKEN_KEY = 'scgs.auth.token';
const USER_KEY = 'scgs.auth.user';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [photoBust, setPhotoBust] = useState(0);

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricKind, setBiometricKind] = useState<BiometricKind>('biometrics');

  // Restore a persisted session on launch.
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser, bioEnabled, bioInfo] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
          isBiometricEnabled(),
          biometricAvailable(),
        ]);
        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
        setBiometricEnabled(bioEnabled);
        setBiometricSupported(bioInfo.available);
        setBiometricKind(bioInfo.kind);
      } catch {
        // ignore restore errors — user simply logs in again
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const applySession = useCallback(async (nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, nextToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser)),
    ]);
  }, []);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const res = await api.login(identifier.trim(), password);
      await applySession(res.token, res.user);
    },
    [applySession],
  );

  const signInWithBiometric = useCallback(async () => {
    const restored = await unlockBiometricSession('Sign in to SCGS');
    if (!restored) return false;
    await applySession(restored.token, restored.user);
    return true;
  }, [applySession]);

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);
    setBiometricEnabled(false);
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
      clearBiometric(),
    ]);
  }, []);

  const updateUser = useCallback(async (next: AuthUser) => {
    setUser(next);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
  }, []);

  const markPasswordChanged = useCallback(async () => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, mustChangePassword: false };
      AsyncStorage.setItem(USER_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const enableBiometric = useCallback(async () => {
    if (!token || !user) throw new Error('Sign in first');
    await storeBiometricSession(token, user);
    setBiometricEnabled(true);
  }, [token, user]);

  const disableBiometric = useCallback(async () => {
    await clearBiometric();
    setBiometricEnabled(false);
  }, []);

  const bumpPhoto = useCallback(() => setPhotoBust((n) => n + 1), []);

  const value = useMemo(
    () => ({
      token,
      user,
      isReady,
      photoBust,
      biometricEnabled,
      biometricSupported,
      biometricKind,
      signIn,
      signInWithBiometric,
      signOut,
      updateUser,
      markPasswordChanged,
      enableBiometric,
      disableBiometric,
      bumpPhoto,
    }),
    [
      token,
      user,
      isReady,
      photoBust,
      biometricEnabled,
      biometricSupported,
      biometricKind,
      signIn,
      signInWithBiometric,
      signOut,
      updateUser,
      markPasswordChanged,
      enableBiometric,
      disableBiometric,
      bumpPhoto,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
