import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Extract subdomain
  const parts = hostname.split('.');
  let subdomain = '';
  
  if (hostname.includes('localhost')) {
    subdomain = parts[0];
    if (subdomain.includes(':')) {
      subdomain = subdomain.split(':')[0];
    }
  } else {
    if (parts.length >= 3) {
      subdomain = parts[0];
    }
  }
  
  // For subdomain routes, rewrite to main pages (VendorContext will handle theme)
  if (subdomain && 
      subdomain !== 'www' && 
      subdomain !== 'marketplace' && 
      subdomain !== 'localhost' &&
      !hostname.includes('vercel.app') &&
      !hostname.includes('netlify.app')) {
    
    const url = request.nextUrl.clone();
    
    // Don't rewrite auth/account routes - use main site's pages
    const authRoutes = ['login', 'signup', 'register', 'verify-email', 'resend-verification', 'forgot-password', 'reset-password'];
    const firstSegment = pathname.split('/').filter(Boolean)[0];
    if (authRoutes.includes(firstSegment)) {
      return NextResponse.next();
    }
    
    // Don't rewrite dashboard - buyers should access their regular dashboard
    if (firstSegment === 'dashboard') {
      return NextResponse.next();
    }
    
    // All routes stay the same - VendorContext detects from subdomain
    // Just add vendor slug header for context
    const rewriteResponse = NextResponse.next();
    rewriteResponse.headers.set('x-vendor-slug', subdomain);
    return rewriteResponse;
  }

  // For non-subdomain routes, just pass through
  const response = NextResponse.next();
  
  // Protect admin routes
  if (pathname.includes('/admin') && !pathname.includes('/admin/login')) {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect vendor dashboard routes
  if (pathname.includes('/vendor/dashboard')) {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
