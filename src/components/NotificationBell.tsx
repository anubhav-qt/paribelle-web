'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface NotificationBellProps {
  /** Class applied to the trigger button, so it can match either chrome. */
  buttonClassName?: string;
  iconClassName?: string;
}

/**
 * The notification bell — see Task 9 in the implementation plan. Same
 * component on the storefront header and the admin layout; which
 * notifications it shows is decided server-side by role, not here.
 */
export function NotificationBell({ buttonClassName, iconClassName }: NotificationBellProps) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
        className={buttonClassName || 'relative p-2 rounded-full hover:bg-gray-100'}
      >
        <Bell className={iconClassName || 'h-5 w-5'} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-2 w-80 max-h-[28rem] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="font-medium text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={() => markAllRead()} className="text-xs text-blue-600 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet.</p>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div
                    onClick={() => {
                      if (!n.readAt) markRead(n.id);
                      setOpen(false);
                    }}
                    className={`cursor-pointer border-b px-4 py-3 hover:bg-gray-50 ${!n.readAt ? 'bg-blue-50/50' : ''}`}
                  >
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-gray-600">{n.body}</p>}
                    <p className="mt-1 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
