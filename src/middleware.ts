import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

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
  
  // Create i18n middleware
  const handleI18nRouting = createIntlMiddleware(routing);
  
  // For subdomain routes, we need to preserve the locale in the rewrite
  if (subdomain && 
      subdomain !== 'www' && 
      subdomain !== 'marketplace' && 
      subdomain !== 'localhost' &&
      !hostname.includes('vercel.app') &&
      !hostname.includes('netlify.app')) {
    
    // First apply i18n to get the locale
    const response = handleI18nRouting(request);
    
    // If it's a redirect (locale detection), return it
    if (response.status === 307 || response.status === 308) {
      return response;
    }
    
    // Now handle subdomain rewriting with locale preserved
    const url = request.nextUrl.clone();
    const pathSegments = pathname.split('/').filter(Boolean);
    
    const maybeLocale = pathSegments[0];
    const isLocale = routing.locales.includes(maybeLocale as any);
    const localePrefix = isLocale ? `/${maybeLocale}` : '';
    const remainingPath = isLocale ? pathSegments.slice(1) : pathSegments;
    
    // Handle /dashboard route - rewrite to locale-based dashboard
    if (pathname === '/dashboard') {
      url.pathname = `/${routing.defaultLocale}/dashboard`;
      const rewriteResponse = NextResponse.rewrite(url);
      rewriteResponse.headers.set('x-vendor-slug', subdomain);
      return rewriteResponse;
    }
    
    if (remainingPath.length === 0) {
      url.pathname = `${localePrefix}/vendor/${subdomain}`;
    } else if (remainingPath[0] === 'products' && remainingPath[1]) {
      url.pathname = `${localePrefix}/vendor/${subdomain}/products/${remainingPath[1]}`;
    } else if (remainingPath[0] === 'search') {
      url.pathname = `${localePrefix}/vendor/${subdomain}/search`;
    } else if (remainingPath[0] === 'cart') {
      url.pathname = `${localePrefix}/vendor/${subdomain}/cart`;
    } else if (remainingPath[0] === 'checkout') {
      url.pathname = `${localePrefix}/vendor/${subdomain}/checkout`;
    } else if (remainingPath[0] === 'orders') {
      url.pathname = `${localePrefix}/vendor/${subdomain}/orders`;
    } else if (!remainingPath[0]?.startsWith('vendor')) {
      const restOfPath = remainingPath.join('/');
      url.pathname = `${localePrefix}/vendor/${subdomain}/${restOfPath}`;
    }
    
    const rewriteResponse = NextResponse.rewrite(url);
    rewriteResponse.headers.set('x-vendor-slug', subdomain);
    return rewriteResponse;
  }

  // For non-subdomain routes, apply i18n middleware first
  const response = handleI18nRouting(request);
  
  // Then check auth on the (potentially redirected) path
  const finalPathname = response.headers.get('x-middleware-rewrite') || pathname;
  
  // Protect admin routes
  if (finalPathname.includes('/admin') && !finalPathname.includes('/admin/login')) {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = finalPathname.match(/^\/[a-z]{2}\//) ? `/${finalPathname.split('/')[1]}/admin/login` : '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect vendor dashboard routes
  if (finalPathname.includes('/vendor/dashboard')) {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = finalPathname.match(/^\/[a-z]{2}\//) ? `/${finalPathname.split('/')[1]}/login` : '/login';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
