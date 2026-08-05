'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useMarketplaceWebSocket } from './StockWebSocketContext';

export interface AppNotification {
  id: string;
  userId: string | null;
  audience: 'user' | 'admin';
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  orderId: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refetch: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

const authHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * The notification bell's data layer — see Task 9 in the implementation
 * plan. Fetches history on load (a socket event only tells you what happened
 * while the tab was open) and layers live updates from the socket on top.
 */
export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { subscribeToNotifications } = useMarketplaceWebSocket();

  const load = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL;
      const [listRes, countRes] = await Promise.all([
        fetch(`${base}/api/v1/notifications?limit=20`, { headers: authHeaders() }),
        fetch(`${base}/api/v1/notifications/unread-count`, { headers: authHeaders() }),
      ]);
      if (listRes.ok) setNotifications(await listRes.json());
      if (countRes.ok) setUnreadCount((await countRes.json()).count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    });
    return unsubscribe;
  }, [subscribeToNotifications]);

  const markRead = useCallback(async (id: string) => {
    const wasUnread = notifications.find((n) => n.id === id && !n.readAt);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/read-all`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading, markRead, markAllRead, refetch: load }}>
      {children}
    </NotificationsContext.Provider>
  );
};
