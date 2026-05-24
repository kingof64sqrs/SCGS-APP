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

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isReady: boolean;
  /** Bumped when the current user's photo changes, to bust image caches. */
  photoBust: number;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: AuthUser) => Promise<void>;
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

  // Restore a persisted session on launch.
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch {
        // ignore restore errors — user simply logs in again
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api.login(email.trim(), password);
    setToken(res.token);
    setUser(res.user);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, res.token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user)),
    ]);
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);
    await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(USER_KEY)]);
  }, []);

  const updateUser = useCallback(async (next: AuthUser) => {
    setUser(next);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
  }, []);

  const bumpPhoto = useCallback(() => setPhotoBust((n) => n + 1), []);

  const value = useMemo(
    () => ({ token, user, isReady, photoBust, signIn, signOut, updateUser, bumpPhoto }),
    [token, user, isReady, photoBust, signIn, signOut, updateUser, bumpPhoto],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
