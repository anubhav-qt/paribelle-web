'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { clearAuth } from '@/lib/auth';
import { ADMIN_NAV } from './adminNav';
import { NotificationBell } from '@/components/NotificationBell';

/**
 * Chrome for the store panel. The login page renders bare — it is reached
 * without a session, so the nav would only offer links that bounce back here.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <Link href="/admin" className="font-display text-xl italic text-gray-900">
            PariBelle
          </Link>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            Store Admin
          </span>

          <nav className="ml-auto flex items-center gap-1 overflow-x-auto">
            {ADMIN_NAV.slice(0, 5).map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <NotificationBell
              variant="admin"
              buttonClassName="relative rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              iconClassName="h-4 w-4"
            />
            <Link
              href="/"
              className="whitespace-nowrap text-sm text-gray-600 hover:text-gray-900"
            >
              View store
            </Link>
            <button
              onClick={() => {
                clearAuth();
                window.location.href = '/admin/login';
              }}
              aria-label="Log out"
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
