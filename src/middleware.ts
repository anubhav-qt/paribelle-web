import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Gate for the store panel. There is one store and one panel, so the only
 * routing decision left is whether the caller is signed in — the subdomain
 * rewriting that used to live here served per-vendor storefronts.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // The vendor dashboard and the admin panel are the same thing now.
  if (pathname === '/vendor' || pathname.startsWith('/vendor/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
