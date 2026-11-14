import { type NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE_NAME = 'sb_access';
const PUBLIC_PATHS = ['/login', '/manifest.webmanifest', '/favicon.ico'];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }
  if (pathname.startsWith('/p/')) {
    return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccessCookie = Boolean(request.cookies.get(ACCESS_COOKIE_NAME)?.value);

  if (pathname === '/login') {
    if (hasAccessCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!isPublicRoute(pathname) && !hasAccessCookie) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)'],
};
