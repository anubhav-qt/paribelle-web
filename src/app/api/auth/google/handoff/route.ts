import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_HANDOFF_COOKIE, GOOGLE_HANDOFF_PATH, secureCookies } from '@/lib/googleSignIn';

export const dynamic = 'force-dynamic';

/**
 * Hands the session the Google callback left in an httpOnly cookie to the
 * /auth/google page, once: the cookie is cleared in the same response. POST,
 * so nothing prefetches or caches it; and only this site's own pages can read
 * the answer.
 */
export async function POST(request: NextRequest) {
  const raw = request.cookies.get(GOOGLE_HANDOFF_COOKIE)?.value;

  let session: { token?: unknown; user?: unknown } | null = null;
  try {
    session = raw ? JSON.parse(raw) : null;
  } catch {
    session = null;
  }

  const ok = !!session && typeof session.token === 'string' && !!session.user && typeof session.user === 'object';
  const response = ok
    ? NextResponse.json({ token: session!.token, user: session!.user })
    : NextResponse.json({ message: 'This Google sign-in has expired. Please sign in again.' }, { status: 401 });

  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set(GOOGLE_HANDOFF_COOKIE, '', {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: 'lax',
    path: GOOGLE_HANDOFF_PATH,
    maxAge: 0,
  });
  return response;
}
