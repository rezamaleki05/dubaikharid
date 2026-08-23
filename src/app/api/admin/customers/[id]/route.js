import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { attachOrderAggregates, validateCustomerInput } from '@/lib/adminCustomers';
import { prisma } from '@/lib/prisma';

function validId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 128;
}

async function customerDetails(id) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return null;
  const [serialized, orders] = await Promise.all([
    attachOrderAggregates([customer]).then(items => items[0]),
    prisma.order.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, orderCode: true, status: true, totalToman: true, createdAt: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, amount: true, method: true, status: true, reference: true, createdAt: true } },
      },
    }),
  ]);
  return { ...serialized, recentOrders: orders };
}

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CUSTOMERS_VIEW);
  if (response) return response;
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: 'شناسه مشتری معتبر نیست.' }, { status: 400 });
  try {
    const customer = await customerDetails(id);
    return customer ? NextResponse.json(customer) : NextResponse.json({ error: 'مشتری پیدا نشد.' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching admin customer:', error);
    return NextResponse.json({ error: 'دریافت جزئیات مشتری با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CUSTOMERS_EDIT);
  if (response) return response;
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: 'شناسه مشتری معتبر نیست.' }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { body = null; }
  const validation = validateCustomerInput(body, { partial: true });
  if (validation.error) return NextResponse.json({ error: validation.error }, { status: 400 });
  if (!Object.keys(validation.data).length) return NextResponse.json({ error: 'تغییری ارسال نشده است.' }, { status: 400 });

  try {
    const previous = await prisma.customer.findUnique({ where: { id }, select: { status: true } });
    if (!previous) return NextResponse.json({ error: 'مشتری پیدا نشد.' }, { status: 404 });
    await prisma.customer.update({ where: { id }, data: validation.data });
    const newStatus = validation.data.status;
    const action = newStatus && newStatus !== previous.status
      ? (newStatus === 'inactive' ? 'CUSTOMER_DEACTIVATED' : 'CUSTOMER_ACTIVATED')
      : 'CUSTOMER_UPDATED';
    await logAdminActivity({
      adminId: admin.id, action, entityType: 'Customer', entityId: id,
      metadata: newStatus && newStatus !== previous.status ? { previousStatus: previous.status, newStatus } : null,
      request,
    });
    return NextResponse.json(await customerDetails(id));
  } catch (error) {
    if (error?.code === 'P2002' || error?.cause?.code === '23505') {
      return NextResponse.json({ error: 'مشتری دیگری با این شماره تماس ثبت شده است.' }, { status: 409 });
    }
    console.error('Error updating admin customer:', error);
    return NextResponse.json({ error: 'به‌روزرسانی مشتری با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CUSTOMERS_EDIT);
  if (response) return response;
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: 'شناسه مشتری معتبر نیست.' }, { status: 400 });
  try {
    const customer = await prisma.customer.findUnique({ where: { id }, select: { status: true, _count: { select: { orders: true } } } });
    if (!customer) return NextResponse.json({ error: 'مشتری پیدا نشد.' }, { status: 404 });
    if (customer.status === 'inactive') return NextResponse.json({ error: 'این مشتری قبلاً غیرفعال شده است.' }, { status: 409 });
    await prisma.customer.update({ where: { id }, data: { status: 'inactive' } });
    await logAdminActivity({ adminId: admin.id, action: 'CUSTOMER_DEACTIVATED', entityType: 'Customer', entityId: id, metadata: { previousStatus: customer.status, orderCount: customer._count.orders }, request });
    return NextResponse.json(await customerDetails(id));
  } catch (error) {
    console.error('Error deactivating admin customer:', error);
    return NextResponse.json({ error: 'غیرفعال‌سازی مشتری با خطا مواجه شد.' }, { status: 500 });
  }
}
