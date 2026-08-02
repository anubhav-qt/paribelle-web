import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const stateParam = searchParams.get('state');
    
    // Parse state parameter
    let state = { type: 'login', returnUrl: '' };
    try {
      if (stateParam) {
        state = JSON.parse(stateParam);
      }
    } catch (e) {
      // Fallback for old state format (just a string)
      state = { type: stateParam || 'login', returnUrl: '' };
    }

    if (error || !code) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    }

    // Dynamically construct redirect_uri (must match what was sent to Google)
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

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
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
    }

    const { access_token } = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=user_info_failed', request.url));
    }

    const googleUser = await userInfoResponse.json();

    // Regular login flow
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log('[Callback] Calling backend google-login at:', `${backendUrl}/api/v1/auth/google-login`);
    
    const authResponse = await fetch(`${backendUrl}/api/v1/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.id,
        picture: googleUser.picture,
      }),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('[Callback] Backend auth failed:', authResponse.status, errorText);
      return NextResponse.redirect(new URL('/login?error=auth_failed&message=' + encodeURIComponent(`Backend authentication failed: ${errorText}`), request.url));
    }

    const authData = await authResponse.json();
    console.log('Backend auth response:', { hasToken: !!authData.token, hasUser: !!authData.user });
    
    const token = authData.token;
    const user = authData.user;

    if (!token) {
      console.error('No token in auth response:', authData);
      return NextResponse.redirect(new URL('/login?error=no_token&message=' + encodeURIComponent('Authentication failed - no token received'), request.url));
    }
    
    if (!user) {
      console.error('No user in auth response:', authData);
      return NextResponse.redirect(new URL('/login?error=no_user&message=' + encodeURIComponent('Authentication failed - no user data received'), request.url));
    }

    // Determine redirect URL based on returnUrl, user role, or default
    let redirectUrl = '/';
    if (state.returnUrl) {
      redirectUrl = state.returnUrl;
    } else if (user?.role === 'vendor_admin' || user?.role === 'super_admin') {
      redirectUrl = '/admin';
    }

    // Redirect with token as query param so frontend can store it
    const redirectResponse = NextResponse.redirect(
      new URL(`${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}&googleAuth=success`, request.url)
    );
    
    // Also set in cookie as backup
    redirectResponse.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return redirectResponse;
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url));
  }
}
