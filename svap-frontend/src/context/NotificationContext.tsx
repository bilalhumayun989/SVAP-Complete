import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { api } from '../services/api';

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

  const getUserId = () => {
    try { return JSON.parse(localStorage.getItem('sz_user') || '{}').id || null; }
    catch { return null; }
  };

  const refreshCount = useCallback(async () => {
    const userId = getUserId();
    if (!userId) { setUnreadCount(0); return; }
    try {
      const res = await api.getNotifications(userId);
      if (res.data) {
        setUnreadCount(res.data.filter((n: any) => !n.is_read).length);
      }
    } catch { /* silent */ }
  }, []);

  // Initial load + when auth changes
  useEffect(() => {
    refreshCount();
    const handler = () => refreshCount();
    window.addEventListener('sz_auth_change', handler);
    return () => window.removeEventListener('sz_auth_change', handler);
  }, [refreshCount]);

  // Supabase Realtime subscription
  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresInsertPayload<NotificationRow>) => {
          const notif = payload.new;
          if (!notif?.id) return;

          // Increment unread count
          setUnreadCount(c => c + 1);

          // Show toast only once per notification id
          if (!seenIds.current.has(notif.id)) {
            seenIds.current.add(notif.id);
            const toast: ToastItem = {
              id: notif.id,
              body: notif.body || notif.title || 'New swap request received',
              route: '/requests',
            };
            setToasts(prev => [...prev, toast]);
            // Auto-dismiss after 4s
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== toast.id));
            }, 4000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, toasts, dismissToast, refreshCount }}>
      {children}
    </NotificationContext.Provider>
  );
};
