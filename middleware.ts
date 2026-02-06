import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Admin routes that need protection
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminSession = request.cookies.get('admin_session')?.value;

    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Customer routes that need protection
  if (
    pathname.startsWith('/customer') &&
    !pathname.startsWith('/customer/login')
  ) {
    const customerSession = request.cookies.get('customer_session')?.value;

    if (!customerSession) {
      return NextResponse.redirect(new URL('/customer/login', request.url));
    }
  }

  // Redirect root to admin login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
