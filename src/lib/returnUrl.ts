/**
 * `value` as a path on this site, or null.
 *
 * Login, signup and the Google callback all send the shopper on to a
 * `?returnUrl=` afterwards. Taken as-is, `javascript:...` runs script with the
 * session in reach, and `https://x`, `//x`, `/\x` or `/<tab>/x` leave the site
 * (the Google callback's redirect carries the token). Resolving the value
 * against a placeholder origin and checking it stayed there catches every
 * spelling, not only the ones a prefix check knows about.
 */
const PLACEHOLDER = 'https://same-site.invalid';

export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/')) return null;
  try {
    const url = new URL(value, PLACEHOLDER);
    return url.origin === PLACEHOLDER ? url.pathname + url.search : null;
  } catch {
    return null;
  }
}
