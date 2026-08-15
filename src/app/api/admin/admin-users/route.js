import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'FINANCE', 'CONTENT']);

const safeAdminSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.ADMIN_USERS_MANAGE);
  if (response) return response;

  const admins = await prisma.adminUser.findMany({
    select: safeAdminSelect,
    orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json(admins);
}

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.ADMIN_USERS_MANAGE);
  if (response) return response;

  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const role = typeof body?.role === 'string' ? body.role : 'ADMIN';

    if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'ایمیل معتبر نیست.' }, { status: 400 });
    }

    if (password.length < 10 || password.length > 256) {
      return NextResponse.json({ error: 'رمز عبور باید حداقل ۱۰ کاراکتر باشد.' }, { status: 400 });
    }

    if (!ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: 'نقش انتخاب‌شده معتبر نیست.' }, { status: 400 });
    }

    if (role === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const created = await prisma.adminUser.create({
      data: {
        email,
        passwordHash: await hash(password, 12),
        role,
        status: 'ACTIVE',
      },
      select: safeAdminSelect,
    });

    await logAdminActivity({
      adminId: admin.id,
      action: 'ADMIN_USER_CREATED',
      entityType: 'AdminUser',
      entityId: created.id,
      metadata: { email: created.email, role: created.role },
      request,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده است.' }, { status: 409 });
    }
    throw error;
  }
}
