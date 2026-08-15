import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { adjustWarehouseStock, serializeWarehouseItem, WarehouseDomainError } from '@/lib/adminWarehouse';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

export async function POST(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.WAREHOUSE_EDIT);
  if (response) return response;
  const { id } = await params;
  if (typeof id !== 'string' || !id || id.length > 128) return NextResponse.json({ error: 'شناسه کالا معتبر نیست.' }, { status: 400 });
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 }); }
  const amount = Number(body?.quantity);
  const direction = body?.type;
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
  if (!Number.isSafeInteger(amount) || amount <= 0 || !['increase', 'decrease'].includes(direction)) {
    return NextResponse.json({ error: 'نوع و تعداد تغییر موجودی معتبر نیست.' }, { status: 400 });
  }
  const quantityChange = direction === 'increase' ? amount : -amount;
  try {
    const item = await adjustWarehouseStock(prisma, {
      id,
      quantityChange,
      reason: reason || (direction === 'increase' ? 'تغییر دستی موجودی' : 'کاهش دستی موجودی'),
      adminId: admin.id,
      type: direction === 'increase' ? 'STOCK_IN' : 'STOCK_OUT',
    });
    await logAdminActivity({
      adminId: admin.id,
      action: 'WAREHOUSE_STOCK_ADJUSTED',
      entityType: 'WarehouseItem',
      entityId: id,
      metadata: { quantityChange, quantityAfter: item.stock, reason: reason || null },
      request,
    });
    return NextResponse.json(serializeWarehouseItem(item));
  } catch (error) {
    if (error instanceof WarehouseDomainError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('Warehouse stock adjustment failed:', error);
    return NextResponse.json({ error: 'تغییر موجودی با خطا مواجه شد.' }, { status: 500 });
  }
}
