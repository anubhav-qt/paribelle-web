import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state') || ''; // Get state parameter for vendor registration
    const returnUrl = searchParams.get('returnUrl') || ''; // Get returnUrl for post-login redirect
    
    // Combine state and returnUrl into state parameter
    const stateData = JSON.stringify({ 
      type: state || 'login',
      returnUrl: returnUrl 
    });
    
    // Pinned to a configured origin rather than derived from the request's
    // Host header. Google rejects a redirect_uri that isn't byte-for-byte one
    // of the URIs registered on the OAuth client — if a visitor reached the
    // site on the apex domain instead of `www`, or Vercel served a preview
    // hostname, a header-derived URI here would be a value nobody registered,
    // and the flow would fail with `redirect_uri_mismatch` before the user
    // even sees the consent screen. Register this exact value in Google Cloud
    // Console → Credentials → Authorized redirect URIs.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl.replace(/\/$/, '')}/api/auth/google/callback`;

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: stateData,
    })}`;

    return NextResponse.redirect(googleAuthUrl);
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  }
}
