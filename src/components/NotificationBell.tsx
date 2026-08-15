'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  /** Storefront uses the PariBelle palette; admin keeps its own plain
   * gray chrome, since this component is shared between the two layouts. */
  variant?: 'storefront' | 'admin';
}

/**
 * The notification bell — see Task 9 in the implementation plan. Same
 * component on the storefront header and the admin layout; which
 * notifications it shows is decided server-side by role, not here.
 */
export function NotificationBell({ buttonClassName, iconClassName, variant = 'storefront' }: NotificationBellProps) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = React.useState(false);

  const isAdmin = variant === 'admin';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
        className={buttonClassName || (isAdmin ? 'relative p-2 rounded-full hover:bg-gray-100' : 'relative p-2 rounded-full hover:bg-[hsl(var(--pb-blush-wash))]')}
      >
        <Bell className={iconClassName || 'h-5 w-5'} />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium text-white',
              isAdmin ? 'bg-red-600' : 'bg-[hsl(var(--pb-rose-deep))]'
            )}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className={cn(
              'absolute right-0 top-full z-20 mt-2 w-80 max-h-[28rem] overflow-y-auto',
              isAdmin
                ? 'rounded-lg border border-gray-200 bg-white shadow-lg'
                : 'rounded-sm border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory))] shadow-pb-md'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-between border-b px-4 py-3',
                isAdmin ? 'border-gray-200' : 'border-[hsl(var(--pb-linen))]'
              )}
            >
              <span className={cn('font-medium', isAdmin ? 'text-gray-900' : 'text-[hsl(var(--pb-ink))]')}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className={cn(
                    'text-xs hover:underline',
                    isAdmin ? 'text-blue-600' : 'text-[hsl(var(--pb-rose-deep))]'
                  )}
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className={cn('px-4 py-6 text-center text-sm', isAdmin ? 'text-gray-500' : 'text-[hsl(var(--pb-ink-faint))]')}>
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div
                    onClick={() => {
                      if (!n.readAt) markRead(n.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'cursor-pointer border-b px-4 py-3',
                      isAdmin
                        ? `border-gray-200 hover:bg-gray-50 ${!n.readAt ? 'bg-blue-50/50' : ''}`
                        : `border-[hsl(var(--pb-linen))] hover:bg-[hsl(var(--pb-shell))] ${!n.readAt ? 'bg-[hsl(var(--pb-blush-wash))]' : ''}`
                    )}
                  >
                    <p className={cn('text-sm font-medium', isAdmin ? 'text-gray-900' : 'text-[hsl(var(--pb-ink))]')}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className={cn('mt-0.5 text-xs', isAdmin ? 'text-gray-600' : 'text-[hsl(var(--pb-ink-muted))]')}>
                        {n.body}
                      </p>
                    )}
                    <p className={cn('mt-1 text-xs', isAdmin ? 'text-gray-400' : 'text-[hsl(var(--pb-ink-faint))]')}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                );
                // Deep-link to the specific thing the notification is about,
                // not just the list it lives in: `orderId` is read by both
                // orders pages to open that order, and whatever the backend
                // put on `link` (e.g. `?view=exchanges`, `?search=` for low
                // stock) decides which view opens.
                //
                // `n=<notification id>` makes every click a distinct URL.
                // Without it, clicking a notification while already sitting
                // on its target URL is a no-op — Next skips the navigation,
                // the query string never changes, and the deep-link effect
                // on the destination page never re-runs. It also lets those
                // pages treat each click as one-shot (open once, then clean
                // the URL) without a second click being swallowed.
                const href = (() => {
                  if (!n.link) return null;
                  const params = new URLSearchParams();
                  if (n.orderId) params.set('orderId', n.orderId);
                  params.set('n', n.id);
                  return `${n.link}${n.link.includes('?') ? '&' : '?'}${params.toString()}`;
                })();
                return href ? (
                  <Link key={n.id} href={href}>
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
