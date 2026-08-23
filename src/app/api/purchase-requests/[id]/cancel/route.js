import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { prisma } from '@/lib/prisma';
import { publicRequestGuard } from '@/lib/publicRequestGuard';

export async function POST(request, { params }) {
  const guard = publicRequestGuard(request, { limit: 8 });
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: 'وارد حساب کاربری نشده‌اید.' }, { status: 401 });
  const { id } = await params;
  if (!id || id.length > 160) return NextResponse.json({ error: 'اطلاعات درخواست معتبر نیست.' }, { status: 400 });
  const current = await prisma.purchaseRequest.findFirst({ where: { id, customerId: customer.id }, include: { order: true } });
  if (!current) return NextResponse.json({ error: 'درخواست خرید پیدا نشد.' }, { status: 404 });
  if (current.order || !['pending', 'price_tagged', 'approved'].includes(current.status)) return NextResponse.json({ error: 'لغو این درخواست در وضعیت فعلی مجاز نیست.' }, { status: 409 });
  const updated = await prisma.purchaseRequest.update({ where: { id }, data: { status: 'cancelled' }, select: { id: true, status: true } });
  return NextResponse.json({ data: updated });
}
