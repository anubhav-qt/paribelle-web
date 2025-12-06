import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // Check if this is vendor registration

    if (error || !code) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    }

    // Exchange code for token with Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
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

    // Check if this is vendor registration (from state parameter or session)
    const isVendorRegistration = state === 'vendor-register';

    if (isVendorRegistration) {
      // Redirect to vendor registration form with Google user data
      const params = new URLSearchParams({
        email: googleUser.email,
        firstName: googleUser.given_name || googleUser.name.split(' ')[0],
        lastName: googleUser.family_name || googleUser.name.split(' ').slice(1).join(' '),
        googleAuth: 'true',
        picture: googleUser.picture || '',
      });
      return NextResponse.redirect(new URL(`/vendor/register?${params.toString()}`, request.url));
    }

    // Regular login flow
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }

    const authData = await authResponse.json();
    const token = authData.token || authData.access_token;

    if (!token) {
      console.error('No token in auth response:', authData);
      return NextResponse.redirect(new URL('/login?error=no_token', request.url));
    }

    // Redirect with token as query param so frontend can store it
    const redirectResponse = NextResponse.redirect(
      new URL(`/?token=${encodeURIComponent(token)}&googleAuth=success`, request.url)
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
