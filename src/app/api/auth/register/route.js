import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { normalizeCustomerPhone } from '@/lib/adminCustomers';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { publicRequestGuard } from '@/lib/publicRequestGuard';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const guard = publicRequestGuard(request, { limit: 6, windowMs: 5 * 60_000 });
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  let body;
  try { body = await request.json(); } catch { body = null; }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 });
  }
  const allowed = new Set(['name', 'phone', 'email', 'password']);
  if (Object.keys(body).some(key => !allowed.has(key))) {
    return NextResponse.json({ error: 'فیلد غیرمجاز در درخواست وجود دارد.' }, { status: 400 });
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const normalizedPhone = normalizeCustomerPhone(phone);
  if (!name || name.length > 160 || !normalizedPhone || password.length < 8 || password.length > 256 || (email && (!EMAIL_PATTERN.test(email) || email.length > 320))) {
    return NextResponse.json({ error: 'اطلاعات ثبت‌نام معتبر نیست.' }, { status: 400 });
  }

  try {
    const { values } = await getSettings(['allowRegistration']);
    if (!values.allowRegistration) {
      return NextResponse.json({ error: 'ثبت‌نام کاربر جدید موقتاً غیرفعال است.' }, { status: 403 });
    }
    const passwordHash = await hash(password, 12);
    const customer = await prisma.$transaction(async tx => {
      const [phoneMatch, emailMatch] = await Promise.all([
        tx.customer.findUnique({ where: { normalizedPhone }, select: { id: true } }),
        email ? tx.customer.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } }) : null,
      ]);
      if (phoneMatch || emailMatch) {
        const conflict = new Error('CUSTOMER_EXISTS');
        conflict.code = 'CUSTOMER_EXISTS';
        throw conflict;
      }
      return tx.customer.create({
        data: { name, phone, normalizedPhone, email: email || null, passwordHash, group: 'سایت', status: 'active' },
        select: { id: true, name: true, phone: true, email: true, createdAt: true },
      });
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error) {
    if (error?.code === 'P2002' || error?.code === 'CUSTOMER_EXISTS') {
      return NextResponse.json({ error: 'حسابی با این شماره موبایل یا ایمیل قبلاً ثبت شده است.' }, { status: 409 });
    }
    console.error('Error registering customer:', error);
    return NextResponse.json({ error: 'ثبت‌نام با خطا مواجه شد.' }, { status: 500 });
  }
}
