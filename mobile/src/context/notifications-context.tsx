import * as Notifications from 'expo-notifications';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { api } from '@/api/client';
import type { AppNotification } from '@/api/types';
import { useAuth } from '@/context/auth-context';
import { registerForPush } from '@/utils/push';

type NotificationsContextValue = {
  items: AppNotification[];
  unread: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const registeredToken = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.getNotifications(token);
      setItems(res.items);
      setUnread(res.unread);
    } catch {
      // ignore — will retry on next refresh
    } finally {
      setLoading(false);
    }
  }, [token]);

  // On sign-in: register this device for push + load notifications.
  useEffect(() => {
    if (!token) {
      setItems([]);
      setUnread(0);
      registeredToken.current = null;
      return;
    }
    void refresh();
    (async () => {
      const expoToken = await registerForPush();
      if (expoToken && expoToken !== registeredToken.current) {
        registeredToken.current = expoToken;
        api.registerPushToken(token, expoToken).catch(() => {});
      }
    })();
  }, [token, refresh]);

  // Refresh the list whenever a push arrives (foreground) or is tapped.
  // Wrapped in try/catch — Expo Go on Android (SDK 53+) throws on listener calls.
  useEffect(() => {
    if (!token) return;
    try {
      const received = Notifications.addNotificationReceivedListener(() => void refresh());
      const responded = Notifications.addNotificationResponseReceivedListener(() => void refresh());
      return () => {
        received.remove();
        responded.remove();
      };
    } catch {
      // Expo Go — listeners unavailable, skip silently.
    }
  }, [token, refresh]);

  const markRead = useCallback(
    async (id: string) => {
      if (!token) return;
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
      await api.markNotificationsRead(token, id).catch(() => {});
    },
    [token],
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await api.markNotificationsRead(token).catch(() => {});
  }, [token]);

  const value = useMemo(
    () => ({ items, unread, loading, refresh, markRead, markAllRead }),
    [items, unread, loading, refresh, markRead, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
