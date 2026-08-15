import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, getAdminSessionCookieOptions } from '@/lib/adminAuth';
import { getCurrentAdmin } from '@/lib/adminAuthorization';
import { logAdminActivity } from '@/lib/adminActivity';

export async function POST(request) {
  const admin = await getCurrentAdmin(request.cookies).catch(() => null);
  if (admin) {
    await logAdminActivity({ adminId: admin.id, action: 'ADMIN_LOGOUT', request });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...getAdminSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
