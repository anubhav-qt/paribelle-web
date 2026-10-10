/**
 * Cookie names and settings shared by the Google sign-in routes
 * (/api/auth/google, its callback and its handoff) and the page that
 * finishes the sign-in (/auth/google).
 *
 * Both cookies are httpOnly and short-lived, scoped to the routes that read
 * them. The state cookie ties a callback to a sign-in this browser started;
 * the handoff cookie carries the session from the callback to the page, so the
 * token never appears in a URL.
 */
export const GOOGLE_STATE_COOKIE = 'pb_google_state';
export const GOOGLE_HANDOFF_COOKIE = 'pb_google_handoff';

export const GOOGLE_STATE_PATH = '/api/auth/google';
export const GOOGLE_HANDOFF_PATH = '/api/auth/google/handoff';

/** Where the callback sends the browser to finish signing in. */
export const GOOGLE_FINISH_PAGE = '/auth/google';

export function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/**
 * The state cookie is set on whichever host the sign-in began on and read on
 * the configured app origin, where Google sends the callback. Scoping it to
 * the root domain lets a sign-in begun on paribelle.in finish on
 * www.paribelle.in. Any other host (localhost, a preview deployment) keeps it
 * to itself.
 */
export function sharedCookieDomain(requestHost: string): string | undefined {
  const appHost = new URL(appOrigin()).hostname;
  if (appHost === 'localhost' || /^[\d.]+$/.test(appHost)) return undefined;
  const root = appHost.split('.').slice(-2).join('.');
  const host = requestHost.split(':')[0];
  return host === root || host.endsWith(`.${root}`) ? `.${root}` : undefined;
}

export function secureCookies(): boolean {
  return process.env.NODE_ENV === 'production';
}
