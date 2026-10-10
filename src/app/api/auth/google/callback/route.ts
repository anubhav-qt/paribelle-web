import { NextRequest, NextResponse } from 'next/server';
import { safeReturnPath } from '@/lib/returnUrl';
import { isStoreAdminRole } from '@/lib/auth';
import {
  GOOGLE_FINISH_PAGE,
  GOOGLE_HANDOFF_COOKIE,
  GOOGLE_HANDOFF_PATH,
  GOOGLE_STATE_COOKIE,
  GOOGLE_STATE_PATH,
  appOrigin,
  secureCookies,
  sharedCookieDomain,
} from '@/lib/googleSignIn';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || request.nextUrl.host;

  // Every way out of here spends the state cookie, so a callback URL can't be
  // replayed against it. The redirect is built on the configured origin: in
  // the container `request.url` is the address the server listens on
  // (https://0.0.0.0:3000), which sent every Google sign-in there.
  const finish = (to: string) => {
    const response = NextResponse.redirect(new URL(to, appOrigin()));
    response.cookies.set(GOOGLE_STATE_COOKIE, '', {
      httpOnly: true,
      secure: secureCookies(),
      sameSite: 'lax',
      path: GOOGLE_STATE_PATH,
      domain: sharedCookieDomain(host),
      maxAge: 0,
    });
    return response;
  };

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const stateParam = searchParams.get('state');

    let returnUrl = '';
    let nonce = '';
    try {
      const state = stateParam ? JSON.parse(stateParam) : null;
      // The session is handed only to a path on this site.
      returnUrl = safeReturnPath(state?.returnUrl) ?? '';
      nonce = typeof state?.nonce === 'string' ? state.nonce : '';
    } catch {
      // Not JSON: not a sign-in this site started.
    }

    if (error || !code) {
      return finish('/login?error=oauth_failed');
    }

    // Only a sign-in this browser started may finish here (see /api/auth/google).
    const expected = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
    if (!nonce || !expected || nonce !== expected) {
      return finish('/login?error=oauth_failed');
    }

    // Must be byte-for-byte identical to the redirect_uri sent in the initial
    // authorization request (see /api/auth/google/route.ts) — Google's token
    // endpoint rejects a mismatch. Pinned to the same configured origin for
    // the same reason: deriving it from the incoming Host header meant this
    // and the initiate step could disagree if the request arrived on a
    // different hostname than the one Google was actually told about.
    const redirectUri = `${appOrigin()}/api/auth/google/callback`;

    // Exchange code for token with Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return finish('/login?error=token_exchange_failed');
    }

    const { access_token } = await tokenResponse.json();

    // The backend asks Google itself who this token belongs to; it no longer
    // takes an email from us on trust.
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const authResponse = await fetch(`${backendUrl}/api/v1/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: access_token }),
    });

    if (!authResponse.ok) {
      console.error('[Callback] Backend auth failed:', authResponse.status, await authResponse.text());
      return finish('/login?error=auth_failed');
    }

    const { token, user } = await authResponse.json();
    if (!token || !user) {
      console.error('[Callback] The backend auth response had no', token ? 'user' : 'token');
      return finish('/login?error=auth_failed');
    }

    const next = returnUrl || (isStoreAdminRole(user.role) ? '/admin' : '/');

    // The session used to ride in this redirect's query string, which put the
    // token in the browser history and in the address any analytics on the
    // landing page reported; and only the home page read it, so a shopper
    // signing in from checkout arrived signed out. The finishing page now
    // collects it from this cookie, once, wherever the shopper is going.
    const response = finish(`${GOOGLE_FINISH_PAGE}?next=${encodeURIComponent(next)}`);
    response.cookies.set(GOOGLE_HANDOFF_COOKIE, JSON.stringify({ token, user }), {
      httpOnly: true,
      secure: secureCookies(),
      sameSite: 'lax',
      path: GOOGLE_HANDOFF_PATH,
      maxAge: 2 * 60,
    });
    // An httpOnly `token` an earlier version set here. Pages can't read or
    // clear it, so it outlived signing out.
    response.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 });
    return response;
  } catch (error) {
    console.error('Google callback error:', error);
    return finish('/login?error=callback_failed');
  }
}
