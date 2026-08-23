import { compare, hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { prisma } from '@/lib/prisma';
import { publicRequestGuard } from '@/lib/publicRequestGuard';

export async function POST(request) {
  const guard = publicRequestGuard(request, { limit: 6, windowMs: 5 * 60_000 });
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: 'وارد حساب کاربری نشده‌اید.' }, { status: 401 });
  if (!customer.passwordHash) return NextResponse.json({ error: 'برای حساب‌های ورود اجتماعی هنوز رمز عبور تعریف نشده است.' }, { status: 409 });

  let body;
  try { body = await request.json(); } catch { body = null; }
  const allowed = new Set(['currentPassword', 'newPassword']);
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !allowed.has(key))) {
    return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 });
  }
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (currentPassword.length > 256 || newPassword.length < 8 || newPassword.length > 256) {
    return NextResponse.json({ error: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد.' }, { status: 400 });
  }
  if (!(await compare(currentPassword, customer.passwordHash))) {
    return NextResponse.json({ error: 'رمز عبور فعلی صحیح نیست.' }, { status: 400 });
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { passwordHash: await hash(newPassword, 12), sessionVersion: { increment: 1 } },
  });
  return NextResponse.json({ data: { changed: true } });
}
