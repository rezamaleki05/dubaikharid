import 'server-only';

import { prisma } from '@/lib/prisma';

export const CUSTOMER_STATUS_SET = new Set(['active', 'vip', 'inactive']);
export const CUSTOMER_GROUP_SET = new Set(['عادی', 'VIP', 'همکار', 'سایت', 'جدید']);

const digitMap = new Map([
  ['۰', '0'], ['۱', '1'], ['۲', '2'], ['۳', '3'], ['۴', '4'],
  ['۵', '5'], ['۶', '6'], ['۷', '7'], ['۸', '8'], ['۹', '9'],
  ['٠', '0'], ['١', '1'], ['٢', '2'], ['٣', '3'], ['٤', '4'],
  ['٥', '5'], ['٦', '6'], ['٧', '7'], ['٨', '8'], ['٩', '9'],
]);

export function normalizeCustomerPhone(value) {
  if (typeof value !== 'string') return null;
  const ascii = Array.from(value.trim(), character => digitMap.get(character) ?? character).join('');
  let compact = ascii.replace(/[^\d+]/g, '');
  if (!compact || (compact.match(/\+/g)?.length ?? 0) > 1 || (compact.includes('+') && !compact.startsWith('+'))) return null;

  if (compact.startsWith('00')) compact = `+${compact.slice(2)}`;
  else if (compact.startsWith('98') && compact.length === 12) compact = `+${compact}`;
  else if (compact.startsWith('971') && compact.length === 12) compact = `+${compact}`;
  else if (/^09\d{9}$/.test(compact)) compact = `+98${compact.slice(1)}`;
  else if (/^05\d{8}$/.test(compact)) compact = `+971${compact.slice(1)}`;

  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null;
}

export function customerAvatar(name) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f87820&textColor=ffffff`;
}

export function formatCustomerDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}

export function serializeCustomer(customer, aggregate = null) {
  const orderCount = aggregate?._count?._all ?? 0;
  const totalToman = aggregate?._sum?.totalToman ?? 0;
  return {
    id: customer.id,
    code: customer.code,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || '',
    city: customer.city || '',
    group: customer.group,
    status: customer.status,
    notes: customer.notes || '',
    dateReg: formatCustomerDate(customer.createdAt),
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    avatar: customerAvatar(customer.name),
    orderCount,
    totalToman,
    performance: {
      avgOrder: orderCount ? Math.round(totalToman / orderCount) : 0,
      lastOrder: formatCustomerDate(aggregate?._max?.createdAt),
      firstOrder: formatCustomerDate(aggregate?._min?.createdAt),
      maxOrder: aggregate?._max?.totalToman ?? 0,
    },
  };
}

export async function attachOrderAggregates(customers) {
  if (!customers.length) return [];
  const aggregates = await prisma.order.groupBy({
    by: ['customerId'],
    where: { customerId: { in: customers.map(customer => customer.id) }, status: { not: 'cancelled' } },
    _count: { _all: true },
    _sum: { totalToman: true },
    _max: { totalToman: true, createdAt: true },
    _min: { createdAt: true },
  });
  const byCustomer = new Map(aggregates.map(aggregate => [aggregate.customerId, aggregate]));
  return customers.map(customer => serializeCustomer(customer, byCustomer.get(customer.id)));
}

export function validateCustomerInput(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'بدنه درخواست معتبر نیست.' };
  const allowed = new Set(['name', 'phone', 'email', 'city', 'group', 'code', 'status', 'notes']);
  if (Object.keys(body).some(key => !allowed.has(key))) return { error: 'فیلد غیرمجاز در درخواست وجود دارد.' };
  const data = {};

  const text = (key, maximum, required = false) => {
    if (!Object.hasOwn(body, key)) return !partial && required ? `${key} الزامی است.` : null;
    if (typeof body[key] !== 'string') return `${key} معتبر نیست.`;
    const value = body[key].trim();
    if (required && !value) return `${key} الزامی است.`;
    if (value.length > maximum) return `${key} بیش از حد طولانی است.`;
    data[key] = value || null;
    return null;
  };

  let error = text('name', 160, true) || text('phone', 40, true) || text('email', 320) || text('city', 120) || text('code', 80) || text('notes', 4000);
  if (error) return { error };
  if (Object.hasOwn(data, 'phone')) {
    const normalizedPhone = normalizeCustomerPhone(data.phone);
    if (!normalizedPhone) return { error: 'شماره تماس باید یک شماره معتبر ایران یا امارات با کد کشور باشد.' };
    data.normalizedPhone = normalizedPhone;
  }
  if (data.email) {
    data.email = data.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { error: 'آدرس ایمیل معتبر نیست.' };
  }
  for (const [key, values, message] of [
    ['group', CUSTOMER_GROUP_SET, 'گروه مشتری معتبر نیست.'],
    ['status', CUSTOMER_STATUS_SET, 'وضعیت مشتری معتبر نیست.'],
  ]) {
    if (!Object.hasOwn(body, key)) continue;
    if (typeof body[key] !== 'string' || !values.has(body[key])) return { error: message };
    data[key] = body[key];
  }
  return { data };
}
