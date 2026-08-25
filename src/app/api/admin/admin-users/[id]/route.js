import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { getAdminDeletionBlocker } from '@/lib/adminUserSafety';
import { prisma } from '@/lib/prisma';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'FINANCE', 'CONTENT']);
const ADMIN_STATUSES = new Set(['ACTIVE', 'DISABLED']);

const safeAdminSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.ADMIN_USERS_MANAGE);
  if (response) return response;

  const { id } = await params;
  const body = await request.json();
  const nextRole = typeof body?.role === 'string' ? body.role : null;
  const nextStatus = typeof body?.status === 'string' ? body.status : null;
  const nextPassword = typeof body?.password === 'string' ? body.password : null;

  if (nextRole && !ADMIN_ROLES.has(nextRole)) {
    return NextResponse.json({ error: 'نقش انتخاب‌شده معتبر نیست.' }, { status: 400 });
  }
  if (nextStatus && !ADMIN_STATUSES.has(nextStatus)) {
    return NextResponse.json({ error: 'وضعیت انتخاب‌شده معتبر نیست.' }, { status: 400 });
  }
  if (nextPassword !== null && (nextPassword.length < 10 || nextPassword.length > 256)) {
    return NextResponse.json({ error: 'رمز عبور باید حداقل ۱۰ کاراکتر باشد.' }, { status: 400 });
  }
  if (!nextRole && !nextStatus && nextPassword === null) {
    return NextResponse.json({ error: 'تغییری ارسال نشده است.' }, { status: 400 });
  }
  if (nextRole === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.adminUser.findUnique({ where: { id } });
      if (!target) return { error: 'NOT_FOUND' };

      if (target.id === admin.id && nextStatus === 'DISABLED') {
        return { error: 'SELF_DISABLE' };
      }
      if (target.id === admin.id && nextRole && nextRole !== target.role) {
        return { error: 'SELF_ROLE_CHANGE' };
      }

      const removesActiveSuperAdmin = target.role === 'SUPER_ADMIN'
        && target.status === 'ACTIVE'
        && ((nextRole && nextRole !== 'SUPER_ADMIN') || nextStatus === 'DISABLED');

      if (removesActiveSuperAdmin) {
        const activeSuperAdmins = await tx.adminUser.count({
          where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
        });
        if (activeSuperAdmins <= 1) return { error: 'LAST_SUPER_ADMIN' };
      }

      const data = {};
      if (nextRole) data.role = nextRole;
      if (nextStatus) data.status = nextStatus;
      if (nextPassword !== null) data.passwordHash = await hash(nextPassword, 12);

      const updated = await tx.adminUser.update({
        where: { id },
        data,
        select: safeAdminSelect,
      });

      return { target, updated };
    }, { isolationLevel: 'Serializable' });

    const errors = {
      NOT_FOUND: ['مدیر موردنظر پیدا نشد.', 404],
      SELF_DISABLE: ['نمی‌توانید حساب فعال خودتان را غیرفعال کنید.', 409],
      SELF_ROLE_CHANGE: ['نمی‌توانید نقش حساب فعلی خودتان را تغییر دهید.', 409],
      LAST_SUPER_ADMIN: ['آخرین مدیر ارشد فعال را نمی‌توان غیرفعال یا تنزل نقش داد.', 409],
    };

    if (result.error) {
      const [message, status] = errors[result.error];
      return NextResponse.json({ error: message }, { status });
    }

    let action = 'ADMIN_USER_UPDATED';
    if (nextPassword !== null) action = 'ADMIN_USER_PASSWORD_CHANGED';
    if (nextRole && nextRole !== result.target.role) action = 'ADMIN_USER_ROLE_CHANGED';
    if (nextStatus === 'DISABLED' && result.target.status !== 'DISABLED') action = 'ADMIN_USER_DEACTIVATED';
    if (nextStatus === 'ACTIVE' && result.target.status !== 'ACTIVE') action = 'ADMIN_USER_ACTIVATED';

    await logAdminActivity({
      adminId: admin.id,
      action,
      entityType: 'AdminUser',
      entityId: result.updated.id,
      metadata: {
        email: result.updated.email,
        role: result.updated.role,
        status: result.updated.status,
      },
      request,
    });

    return NextResponse.json(result.updated);
  } catch (error) {
    if (error?.code === 'P2034') {
      return NextResponse.json({ error: 'تغییر هم‌زمان دیگری ثبت شد؛ دوباره تلاش کنید.' }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.ADMIN_USERS_MANAGE);
  if (response) return response;
  const { id } = await params;
  if (!id || id.length > 160) return NextResponse.json({ error: 'شناسه مدیر معتبر نیست.' }, { status: 400 });

  try {
    const result = await prisma.$transaction(async tx => {
      const target = await tx.adminUser.findUnique({ where: { id }, select: safeAdminSelect });
      const activeSuperAdminCount = target?.role === 'SUPER_ADMIN' && target.status === 'ACTIVE'
        ? await tx.adminUser.count({ where: { role: 'SUPER_ADMIN', status: 'ACTIVE' } })
        : 0;
      const blocker = getAdminDeletionBlocker({ actingAdminId: admin.id, target, activeSuperAdminCount });
      if (blocker) return { error: blocker };
      await tx.adminUser.delete({ where: { id } });
      return { target };
    }, { isolationLevel: 'Serializable' });

    const errors = {
      NOT_FOUND: ['مدیر موردنظر پیدا نشد.', 404],
      SELF_DELETE: ['نمی‌توانید حساب مدیر فعلی را حذف کنید.', 409],
      LAST_SUPER_ADMIN: ['آخرین مدیر ارشد فعال را نمی‌توان حذف کرد.', 409],
    };
    if (result.error) {
      const [message, status] = errors[result.error];
      return NextResponse.json({ error: message }, { status });
    }

    await logAdminActivity({
      adminId: admin.id,
      action: 'ADMIN_USER_DELETED',
      entityType: 'AdminUser',
      entityId: id,
      metadata: { email: result.target.email, role: result.target.role, status: result.target.status },
      request,
    });
    return NextResponse.json({ data: { id } });
  } catch (error) {
    if (error?.code === 'P2034') return NextResponse.json({ error: 'تغییر هم‌زمان دیگری ثبت شد؛ دوباره تلاش کنید.' }, { status: 409 });
    console.error('Admin user delete failed:', error);
    return NextResponse.json({ error: 'حذف مدیر با خطا مواجه شد.' }, { status: 500 });
  }
}
