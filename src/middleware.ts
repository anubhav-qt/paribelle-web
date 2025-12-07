import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const { pathname } = url;
  const hostname = request.headers.get('host') || '';
  
  // Extract subdomain
  const parts = hostname.split('.');
  
  // For localhost development: vendor.localhost:3000
  // For production: vendor.marketplace.com
  let subdomain = '';
  
  if (hostname.includes('localhost')) {
    // Development: vendor.localhost:3000
    subdomain = parts[0];
    // Remove port if present
    if (subdomain.includes(':')) {
      subdomain = subdomain.split(':')[0];
    }
  } else {
    // Production: vendor.marketplace.com
    // We need at least 3 parts: [subdomain, marketplace, com]
    if (parts.length >= 3) {
      subdomain = parts[0];
    }
  }
  
  // Handle subdomain routing FIRST (before auth checks)
  if (subdomain && 
      subdomain !== 'www' && 
      subdomain !== 'marketplace' && 
      subdomain !== 'localhost' &&
      !hostname.includes('vercel.app') &&
      !hostname.includes('netlify.app')) {
    // Rewrite to vendor-specific routes
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // If accessing root of subdomain
    if (pathSegments.length === 0) {
      url.pathname = `/vendor/${subdomain}`;
    }
    // If accessing products
    else if (pathSegments[0] === 'products' && pathSegments[1]) {
      url.pathname = `/vendor/${subdomain}/products/${pathSegments[1]}`;
    }
    // If accessing search
    else if (pathSegments[0] === 'search') {
      url.pathname = `/vendor/${subdomain}/search`;
    }
    // If accessing cart
    else if (pathSegments[0] === 'cart') {
      url.pathname = `/vendor/${subdomain}/cart`;
    }
    // If accessing checkout
    else if (pathSegments[0] === 'checkout') {
      url.pathname = `/vendor/${subdomain}/checkout`;
    }
    // If accessing orders
    else if (pathSegments[0] === 'orders') {
      url.pathname = `/vendor/${subdomain}/orders`;
    }
    // Otherwise, prepend vendor path
    else if (!pathSegments[0]?.startsWith('vendor')) {
      url.pathname = `/vendor/${subdomain}${pathname}`;
    }
    
    // Store vendor slug in header for components to use
    const response = NextResponse.rewrite(url);
    response.headers.set('x-vendor-slug', subdomain);
    return response ;
  }

  // Protect admin routes (except login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('token')?.value;
    
    // If no token, redirect to admin login
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect vendor dashboard routes
  if (pathname.startsWith('/vendor/dashboard')) {
    const token = request.cookies.get('token')?.value;
    
    // If no token, redirect to vendor login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
