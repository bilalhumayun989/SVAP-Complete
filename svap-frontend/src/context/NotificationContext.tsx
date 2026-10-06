import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import { getEnglishNotificationCopy } from '../utils/notificationCopy';

interface ToastItem {
  id: string;
  body: string;
  route?: string;
}

interface NotifCtx {
  unreadCount: number;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  refreshCount: () => void;
}

interface NotificationRow {
  id: string;
  body?: string | null;
  title?: string | null;
  type?: string | null;
  route?: string | null;
  is_read?: boolean;
}

const NotificationContext = createContext<NotifCtx>({
  unreadCount: 0,
  toasts: [],
  dismissToast: () => {},
  refreshCount: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  const hasLoadedOnce = useRef(false);

  const getUserId = () => {
    try { return JSON.parse(localStorage.getItem('sz_user') || '{}').id || null; }
    catch { return null; }
  };

  const syncNotifications = useCallback(async (showNewToasts: boolean) => {
    const userId = getUserId();
    if (!userId) {
      setUnreadCount(0);
      seenIds.current.clear();
      hasLoadedOnce.current = false;
      return;
    }

    try {
      const res = await api.getNotifications(userId);
      const notifications: NotificationRow[] = Array.isArray(res.data) ? res.data : [];
      setUnreadCount(notifications.filter((n) => !n.is_read).length);

      for (const notif of notifications) {
        if (!notif.id || seenIds.current.has(notif.id)) continue;
        seenIds.current.add(notif.id);
        if (!showNewToasts || !hasLoadedOnce.current) continue;

        const englishCopy = getEnglishNotificationCopy(notif);
        const toast: ToastItem = {
          id: notif.id,
          body: englishCopy.body || englishCopy.title || 'New notification received',
          route: notif.route || (notif.type === 'product_question' || notif.type === 'product_answer' ? undefined : '/requests'),
        };
        setToasts((prev) => [...prev, toast]);
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== toast.id));
        }, 4000);
      }
      hasLoadedOnce.current = true;
    } catch {
      // Keep the last known count during temporary API/network failures.
    }
  }, []);

  const refreshCount = useCallback(() => {
    void syncNotifications(false);
  }, [syncNotifications]);

  useEffect(() => {
    void syncNotifications(false);
    const refresh = () => { void syncNotifications(false); };
    const pollForNotifications = () => { void syncNotifications(true); };
    window.addEventListener('sz_auth_change', refresh);
    window.addEventListener('sz_notifications_change', refresh);
    const poll = window.setInterval(pollForNotifications, 15000);
    const handleVisibility = () => {
      if (!document.hidden) pollForNotifications();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('sz_auth_change', refresh);
      window.removeEventListener('sz_notifications_change', refresh);
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [syncNotifications]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, toasts, dismissToast, refreshCount }}>
      {children}
    </NotificationContext.Provider>
  );
};
