import { router } from 'expo-router';
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
import { AppState } from 'react-native';

import { api } from '@/api/client';
import type { AppNotification } from '@/api/types';
import { useAuth } from '@/context/auth-context';
import {
  ensureNotificationPermissions,
  fireLocalNotification,
  registerForPush,
} from '@/utils/push';

// How often to poll the server for new notifications while the app is open.
const POLL_MS = 45_000;

/** Navigate to the screen a tapped notification points at. */
function navigateFromData(data: unknown) {
  const d = (data ?? {}) as { type?: string; refId?: string };
  try {
    if (d.type === 'event' && d.refId) {
      router.push({ pathname: '/event/[id]', params: { id: d.refId } });
    } else {
      router.push('/notifications');
    }
  } catch {
    // navigator not ready yet — ignore
  }
}

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
  // IDs already seen — so we only fire a LOCAL notification for genuinely new
  // items (and never for the whole list on first load).
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.getNotifications(token);
      setItems(res.items);
      setUnread(res.unread);

      // Fire a local notification (banner + sound) for new unread items — this
      // needs NO Firebase/FCM and works in any build while the app is running.
      if (initialized.current) {
        const fresh = res.items.filter((n) => !n.read && !seenIds.current.has(n.id));
        // Newest first from the API; show oldest-of-the-new last so it's on top.
        for (const n of [...fresh].reverse()) {
          void fireLocalNotification(n.title, n.body, { type: n.type, refId: n.refId });
        }
      }
      for (const n of res.items) seenIds.current.add(n.id);
      initialized.current = true;
    } catch {
      // ignore — will retry on next refresh
    } finally {
      setLoading(false);
    }
  }, [token]);

  // On sign-in: ensure notification permission (for local notifications),
  // register for remote push if available, and load notifications.
  useEffect(() => {
    if (!token) {
      setItems([]);
      setUnread(0);
      registeredToken.current = null;
      seenIds.current = new Set();
      initialized.current = false;
      return;
    }
    void ensureNotificationPermissions();
    void refresh();
    (async () => {
      // Remote push only works with FCM/APNs; returns null otherwise (harmless).
      const expoToken = await registerForPush();
      if (expoToken && expoToken !== registeredToken.current) {
        registeredToken.current = expoToken;
        api.registerPushToken(token, expoToken).catch(() => {});
      }
    })();
  }, [token, refresh]);

  // Poll while the app is open + refresh when it returns to the foreground.
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => void refresh(), POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [token, refresh]);

  // Refresh the list whenever a push arrives (foreground) or is tapped, and
  // navigate to the relevant screen on tap. Wrapped in try/catch — Expo Go on
  // Android (SDK 53+) throws on listener calls.
  useEffect(() => {
    if (!token) return;
    try {
      const received = Notifications.addNotificationReceivedListener(() => void refresh());
      const responded = Notifications.addNotificationResponseReceivedListener((response) => {
        void refresh();
        navigateFromData(response.notification.request.content.data);
      });

      // Cold start: app was launched by tapping a notification.
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) navigateFromData(response.notification.request.content.data);
        })
        .catch(() => {});

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
