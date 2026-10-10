/**
 * Shares the login between paribelle.in and www.paribelle.in.
 *
 * The session lives in localStorage, which is per-origin. Login also writes
 * the token and user to cookies on the root domain, and a page that finds
 * localStorage empty copies them back in.
 */

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const parts = `; ${document.cookie}`.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop()?.split(';').shift() || null : null;
}

/** `.localhost` in development, else the root domain (`.paribelle.in`). */
function cookieDomain(): string {
  const hostname = window.location.hostname;
  if (hostname.includes('localhost')) return '.localhost';
  return `.${hostname.split('.').slice(-2).join('.')}`;
}

function secureFlag(): string {
  return window.location.protocol === 'https:' ? '; Secure' : '';
}

/** Default max age: 7 days. */
export function setAuthCookie(name: string, value: string, maxAge: number = 7 * 24 * 60 * 60): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; domain=${cookieDomain()}${secureFlag()}`;
}

export function removeAuthCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; domain=${cookieDomain()}${secureFlag()}`;
}

function announceUserChange() {
  window.dispatchEvent(new CustomEvent('userChanged'));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Fill localStorage from the shared cookies when this origin has no session.
 * Returns the token, or null when there is none.
 */
export async function initAuthFromCookie(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const existingToken = localStorage.getItem('token');
    if (existingToken && localStorage.getItem('user')) return existingToken;

    const cookieToken = getCookie('token');
    if (!cookieToken) return null;
    localStorage.setItem('token', cookieToken);

    const cookieUser = getCookie('user');
    if (cookieUser) {
      try {
        localStorage.setItem('user', JSON.stringify(JSON.parse(decodeURIComponent(cookieUser))));
        announceUserChange();
        return cookieToken;
      } catch {
        // Unreadable user cookie: ask the API instead.
      }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${cookieToken}` },
    });
    if (!response.ok) {
      removeAuthCookie('token');
      removeAuthCookie('user');
      localStorage.removeItem('token');
      return null;
    }
    localStorage.setItem('user', JSON.stringify(await response.json()));
    announceUserChange();
    return cookieToken;
  } catch (error) {
    console.error('Could not restore the session from cookies:', error);
    return null;
  }
}
