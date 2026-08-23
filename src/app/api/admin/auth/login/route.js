import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
} from '@/lib/adminAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { prisma } from '@/lib/prisma';

const INVALID_CREDENTIALS_MESSAGE = 'ایمیل یا رمز عبور اشتباه است.';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || email.length > 254 || !password || password.length > 256) {
      return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE }, { status: 401 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, passwordHash: true, role: true, status: true },
    });

    if (!admin || admin.status !== 'ACTIVE' || !(await compare(password, admin.passwordHash))) {
      return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      await createAdminSessionToken(admin),
      getAdminSessionCookieOptions(),
    );
    await logAdminActivity({ adminId: admin.id, action: 'ADMIN_LOGIN', request });
    return response;
  } catch {
    return NextResponse.json(
      { error: 'ورود در حال حاضر امکان‌پذیر نیست.' },
      { status: 500 },
    );
  }
}
