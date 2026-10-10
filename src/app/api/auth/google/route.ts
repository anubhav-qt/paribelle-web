import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_STATE_PATH,
  appOrigin,
  secureCookies,
  sharedCookieDomain,
} from '@/lib/googleSignIn';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // The nonce goes to Google in `state` and stays here in a cookie; the
    // callback accepts only a state whose nonce matches. Without it, anyone
    // could send a shopper a callback link carrying the code for their own
    // Google account, and the shopper would be signed in as them, saving their
    // address and paying into an account someone else can read.
    const nonce = randomBytes(24).toString('base64url');
    // Where to land after signing in. The callback checks it is a path on this site.
    const stateData = JSON.stringify({ returnUrl: searchParams.get('returnUrl') || '', nonce });

    // Pinned to a configured origin rather than derived from the request's
    // Host header. Google rejects a redirect_uri that isn't byte-for-byte one
    // of the URIs registered on the OAuth client — if a visitor reached the
    // site on the apex domain instead of `www`, or Vercel served a preview
    // hostname, a header-derived URI here would be a value nobody registered,
    // and the flow would fail with `redirect_uri_mismatch` before the user
    // even sees the consent screen. Register this exact value in Google Cloud
    // Console → Credentials → Authorized redirect URIs.
    const redirectUri = `${appOrigin()}/api/auth/google/callback`;

    // `select_account` lets someone with two Google accounts pick one. The
    // earlier `prompt: consent` with offline access put the full consent
    // screen in front of every returning shopper, for a refresh token nothing
    // here uses.
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile',
      prompt: 'select_account',
      state: stateData,
    })}`;

    const response = NextResponse.redirect(googleAuthUrl);
    response.cookies.set(GOOGLE_STATE_COOKIE, nonce, {
      httpOnly: true,
      secure: secureCookies(),
      sameSite: 'lax',
      path: GOOGLE_STATE_PATH,
      domain: sharedCookieDomain(request.headers.get('host') || request.nextUrl.host),
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', appOrigin()));
  }
}
