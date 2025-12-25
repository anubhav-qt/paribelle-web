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
  
  // For subdomain routes, rewrite to vendor store pages
  if (subdomain && 
      subdomain !== 'www' && 
      subdomain !== 'marketplace' && 
      subdomain !== 'localhost' &&
      !hostname.includes('vercel.app') &&
      !hostname.includes('netlify.app')) {
    
    const url = request.nextUrl.clone();
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // Don't rewrite auth/account routes - use main site's pages
    const authRoutes = ['login', 'signup', 'register', 'verify-email', 'resend-verification', 'forgot-password', 'reset-password'];
    if (authRoutes.includes(pathSegments[0])) {
      return NextResponse.next();
    }
    
    // Don't rewrite dashboard - buyers should access their regular dashboard
    if (pathSegments[0] === 'dashboard') {
      return NextResponse.next();
    }
    
    if (pathSegments.length === 0) {
      url.pathname = `/vendor/${subdomain}`;
    } else if (pathSegments[0] === 'products' && pathSegments[1]) {
      url.pathname = `/vendor/${subdomain}/products/${pathSegments[1]}`;
    } else if (pathSegments[0] === 'search') {
      url.pathname = `/vendor/${subdomain}/search`;
    } else if (pathSegments[0] === 'cart') {
      url.pathname = `/vendor/${subdomain}/cart`;
    } else if (pathSegments[0] === 'checkout') {
      url.pathname = `/vendor/${subdomain}/checkout`;
    } else if (pathSegments[0] === 'orders') {
      url.pathname = `/vendor/${subdomain}/orders`;
    } else if (!pathSegments[0]?.startsWith('vendor') && pathSegments[0] !== 'en') {
      const restOfPath = pathSegments.join('/');
      url.pathname = `/vendor/${subdomain}/${restOfPath}`;
    }
    
    const rewriteResponse = NextResponse.rewrite(url);
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
