import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/adminAuth';

const PUBLIC_ADMIN_API_PATHS = new Set([
  '/api/admin/auth/login',
  '/api/admin/auth/logout',
]);

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || PUBLIC_ADMIN_API_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const session = await verifyAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (session) return NextResponse.next();

  if (pathname.startsWith('/api/admin/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.redirect(new URL('/admin', request.url));
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
