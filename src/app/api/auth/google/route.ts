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
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
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
