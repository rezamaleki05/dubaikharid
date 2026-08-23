import { NextResponse } from 'next/server';
import { getCurrentCustomer, serializeCurrentCustomer } from '@/lib/customerAuth';
import { prisma } from '@/lib/prisma';
import { publicRequestGuard } from '@/lib/publicRequestGuard';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: 'وارد حساب کاربری نشده‌اید.' }, { status: 401 });
  return NextResponse.json({ data: serializeCurrentCustomer(customer) });
}

export async function PATCH(request) {
  const guard = publicRequestGuard(request, { limit: 20 });
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: 'وارد حساب کاربری نشده‌اید.' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { body = null; }
  const allowed = new Set(['name', 'email', 'defaultAddress']);
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !allowed.has(key))) {
    return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 });
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const defaultAddress = typeof body.defaultAddress === 'string' ? body.defaultAddress.trim() : '';
  if (!name || name.length > 160 || (email && (!EMAIL_PATTERN.test(email) || email.length > 320)) || defaultAddress.length > 1000) {
    return NextResponse.json({ error: 'اطلاعات پروفایل معتبر نیست.' }, { status: 400 });
  }

  if (email) {
    const duplicate = await prisma.customer.findFirst({
      where: { id: { not: customer.id }, email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) return NextResponse.json({ error: 'این ایمیل قبلاً برای حساب دیگری ثبت شده است.' }, { status: 409 });
  }

  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: { name, email: email || null, defaultAddress: defaultAddress || null },
    select: { id: true, name: true, phone: true, email: true, defaultAddress: true, status: true, sessionVersion: true, createdAt: true, updatedAt: true, passwordHash: true },
  });
  return NextResponse.json({ data: serializeCurrentCustomer(updated) });
}
