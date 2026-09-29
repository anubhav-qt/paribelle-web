'use client';

import { ExternalLink, LogOut, Settings as SettingsIcon, Store, Building2, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { NotificationBell } from '@/components/NotificationBell';
import { DialogHost } from '@/components/admin/pom/dialogs';
import { useSlidingThumb } from '@/components/admin/pom/segmented';
import { Spinner } from '@/components/admin/pom/ui';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminOrders, useRefreshAdminOrders } from '@/hooks/useAdminOrders';
import { exchangeNeedsAdmin, inTab } from '@/lib/admin/orders';
import { clearAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

import { ADMIN_SECTIONS, pageFor, sectionFor, type AdminSection, type SectionKey } from './adminNav';

/**
 * The admin's chrome, built the way POM's header is:
 *
 *  Band 1: the PariBelle wordmark, the section switch (from `sm`), the
 *          notification bell and the settings gear.
 *  Band 2: the current section's screens, as a scrollable rail.
 *
 * Phones get POM's bottom bar instead of the switch, since the admin is run
 * from a phone as much as from a desk. The login page renders bare.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/login') {
    return (
      <>
        {children}
        <DialogHost />
      </>
    );
  }

  return <SignedInShell>{children}</SignedInShell>;
}

function SignedInShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAdminAuth();
  const section = sectionFor(pathname);
  const page = pageFor(pathname, section);

  // The badges on Orders count from the same cached order book the Orders
  // screen and the dashboard read, so they can never disagree.
  const { data: orders } = useAdminOrders(isAuthenticated);
  const refresh = useRefreshAdminOrders();
  const counts = useMemo(() => {
    const list = orders ?? [];
    return {
      toShip: list.filter((o) => inTab(o, 'toShip')).length,
      exchanges: list.reduce((n, o) => n + (o.returns ?? []).filter(exchangeNeedsAdmin).length, 0),
    };
  }, [orders]);

  // A new order or exchange arrives as a notification; refetch so every
  // screen and badge reflects it without a reload.
  const { notifications } = useNotifications();
  const latest = notifications[0]?.id;
  const seen = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!latest || !isAuthenticated) return;
    if (seen.current !== undefined && seen.current !== latest) refresh();
    seen.current = latest;
  }, [latest, isAuthenticated, refresh]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const ordersBadge = counts.toShip + counts.exchanges;

  return (
    <>
      <header
        className="no-print sticky top-0 z-40"
        style={{ background: 'var(--pom-panel)', borderBottom: '1px solid var(--pom-border)' }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Link
            href="/admin"
            className="shrink-0 text-[24px] leading-none tracking-wide transition-colors hover:text-[#c0607a] sm:text-[26px]"
            style={{ fontFamily: 'var(--font-logo)', color: '#3a2a30' }}
          >
            PariBelle
          </Link>

          <div className="hidden sm:block">
            <AppSwitch active={section.key} ordersBadge={ordersBadge} />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="btn hidden px-3 text-[13px] lg:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View store
            </a>
            <NotificationBell variant="admin" buttonClassName="nav-icon-btn" iconClassName="h-[18px] w-[18px]" />
            <SettingsMenu />
          </div>
        </div>

        {section.pages.length > 1 ? <SectionRail section={section} activeHref={page?.href ?? null} /> : null}
      </header>

      <main
        key={section.key}
        className="screen-in mx-auto max-w-7xl px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-14 sm:pt-7"
      >
        {children}
      </main>

      <MobileNav active={section.key} ordersBadge={ordersBadge} />
      <DialogHost />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Band 1: section switch                                                      */
/* -------------------------------------------------------------------------- */

function AppSwitch({ active, ordersBadge }: { active: SectionKey; ordersBadge: number }) {
  const { ref, thumb, ready } = useSlidingThumb(active);
  return (
    <nav
      ref={ref}
      aria-label="Sections"
      className="seg relative inline-flex rounded-[9px] p-[3px]"
      style={{ background: 'var(--pom-panel-2)', border: '1px solid var(--pom-border)' }}
    >
      {thumb}
      {ADMIN_SECTIONS.map((s) => {
        const on = s.key === active;
        return (
          <Link
            key={s.key}
            href={s.href}
            data-active={on}
            aria-current={on ? 'page' : undefined}
            className={cn(
              'seg-item inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[13px] font-medium lg:px-3.5',
              !on && 'muted hover:text-[var(--pom-text)]',
            )}
            style={
              on
                ? {
                    color: 'var(--pom-text)',
                    fontWeight: 600,
                    ...(ready ? {} : { background: 'var(--pom-panel)', boxShadow: 'var(--pom-shadow-xs)' }),
                  }
                : undefined
            }
          >
            {s.label}
            {s.key === 'orders' && ordersBadge > 0 ? <CountDot n={ordersBadge} /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function CountDot({ n }: { n: number }) {
  return (
    <span
      className="pom-round inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums text-white"
      style={{ background: 'var(--pom-warn)' }}
    >
      {n > 99 ? '99+' : n}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Band 2: the section's screens                                               */
/* -------------------------------------------------------------------------- */

function SectionRail({ section, activeHref }: { section: AdminSection; activeHref: string | null }) {
  return (
    <div style={{ borderTop: '1px solid var(--pom-border)' }}>
      <nav
        aria-label={`${section.label} screens`}
        className="scrollbar-hide mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 sm:px-4"
      >
        {section.pages.map((p) => {
          const on = p.href === activeHref;
          return (
            <Link
              key={p.href}
              href={p.href}
              aria-current={on ? 'page' : undefined}
              className="relative shrink-0 whitespace-nowrap px-2.5 py-2.5 text-[13px] transition-colors hover:text-[var(--pom-text)]"
              style={{ color: on ? 'var(--pom-text)' : 'var(--pom-muted)', fontWeight: on ? 600 : 500 }}
            >
              {p.label}
              {on ? (
                <span
                  className="absolute inset-x-2.5 bottom-0 h-[2px] rounded-full"
                  style={{ background: 'var(--pom-accent)' }}
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Band 1: settings gear                                                       */
/* -------------------------------------------------------------------------- */

function SettingsMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [who, setWho] = useState('');

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
      setWho(name || user?.email || '');
    } catch {
      setWho('');
    }
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--pom-accent-soft)]';

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Settings and account"
        className="nav-icon-btn"
      >
        <SettingsIcon
          className="h-[18px] w-[18px] transition-transform duration-500"
          style={{ transform: open ? 'rotate(45deg)' : undefined, transitionTimingFunction: 'var(--pom-ease-spring)' }}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="pom-menu absolute right-0 top-full z-50 mt-2 w-60 p-1.5"
          style={{ animation: 'pom-rise-in 0.28s var(--pom-ease-apple)' }}
        >
          {who ? (
            <p className="truncate px-3 py-2 text-xs" style={{ color: 'var(--pom-muted)' }}>
              Signed in as <span className="font-medium" style={{ color: 'var(--pom-text)' }}>{who}</span>
            </p>
          ) : null}
          <Link href="/admin/settings" className={item}>
            <SettingsIcon className="h-4 w-4" style={{ color: 'var(--pom-muted)' }} />
            Store settings
          </Link>
          <Link href="/admin/store-settings" className={item}>
            <Building2 className="h-4 w-4" style={{ color: 'var(--pom-muted)' }} />
            Business details
          </Link>
          <a href="/" target="_blank" rel="noreferrer" className={item}>
            <Store className="h-4 w-4" style={{ color: 'var(--pom-muted)' }} />
            View store
          </a>
          <a href="/pom" target="_blank" rel="noreferrer" className={item}>
            <PackageSearch className="h-4 w-4" style={{ color: 'var(--pom-muted)' }} />
            Open POM
          </a>
          <div className="mx-2 my-1.5 border-t" />
          <button
            type="button"
            onClick={() => {
              clearAuth();
              window.location.href = '/admin/login';
            }}
            className={cn(item, 'hover:bg-[var(--pom-danger-soft)]')}
            style={{ color: 'var(--pom-danger)' }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Phones: POM's bottom bar                                                    */
/* -------------------------------------------------------------------------- */

function MobileNav({ active, ordersBadge }: { active: SectionKey; ordersBadge: number }) {
  return (
    <nav
      aria-label="Sections"
      className="no-print fixed inset-x-0 bottom-0 z-40 flex sm:hidden"
      style={{
        background: 'var(--pom-panel)',
        borderTop: '1px solid var(--pom-border)',
        boxShadow: '0 -6px 20px rgba(15,37,54,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {ADMIN_SECTIONS.map((s) => {
        const on = s.key === active;
        const Icon = s.icon;
        return (
          <Link
            key={s.key}
            href={s.href}
            aria-current={on ? 'page' : undefined}
            className="relative flex h-[58px] flex-1 flex-col items-center justify-center gap-0.5"
            style={{ color: on ? 'var(--pom-accent-ink)' : 'var(--pom-muted)' }}
          >
            <span className="relative">
              <Icon className="h-[21px] w-[21px]" strokeWidth={on ? 2.2 : 1.9} />
              {s.key === 'orders' && ordersBadge > 0 ? (
                <span className="absolute -right-2.5 -top-1.5">
                  <CountDot n={ordersBadge} />
                </span>
              ) : null}
            </span>
            <span className="text-[10.5px] font-medium" style={{ fontWeight: on ? 600 : 500 }}>
              {s.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
