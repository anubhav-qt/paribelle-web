'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuth } from '@/lib/auth';
import { removeAuthCookie } from '@/lib/cross-domain-auth';

export interface CurrentUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

/** Read the signed-in user out of localStorage, tolerating a corrupt entry. */
function readUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  if (!localStorage.getItem('token')) return null;

  const raw = localStorage.getItem('user');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

/**
 * Who is signed in, and how to sign them out.
 *
 * Reads localStorage rather than holding its own state, and re-reads on the
 * `userChanged` and `storage` events the login, logout and cookie-sync paths
 * already dispatch — so signing out in one tab settles the header in the
 * others. Starts as `null` on the server and on the first client render, since
 * localStorage is not readable during hydration and guessing produces a
 * mismatch.
 */
export function useCurrentUser() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sync = () => setUser(readUser());

    sync();
    setLoaded(true);

    window.addEventListener('userChanged', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('userChanged', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  /**
   * Drop the session and go home.
   *
   * The cookie matters as much as localStorage: it is what
   * `initAuthFromCookie` restores from, so clearing only localStorage would
   * see the shopper silently signed back in on the next page that calls it.
   */
  const logout = useCallback(() => {
    clearAuth();
    removeAuthCookie('token');
    removeAuthCookie('user');
    setUser(null);
    router.push('/');
    router.refresh();
  }, [router]);

  return { user, isLoggedIn: !!user, loaded, logout };
}
