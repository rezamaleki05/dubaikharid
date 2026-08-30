import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import {
  adminWarehouseInclude,
  serializeWarehouseItem,
  updateWarehouseItem,
  validateWarehousePayload,
  WarehouseDomainError,
} from '@/lib/adminWarehouse';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

function validId(id) { return typeof id === 'string' && id.length > 0 && id.length <= 128; }
function errorResponse(error) {
  if (error instanceof WarehouseDomainError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  if (error?.code === 'P2002') return NextResponse.json({ error: 'SKU، نامک عمومی یا محصول مرتبط تکراری است.' }, { status: 409 });
  console.error('Warehouse item operation failed:', error);
  return NextResponse.json({ error: 'عملیات کالای انبار با خطا مواجه شد.' }, { status: 500 });
}

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.WAREHOUSE_VIEW);
  if (response) return response;
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: 'شناسه کالا معتبر نیست.' }, { status: 400 });
  try {
    const item = await prisma.warehouseItem.findUnique({ where: { id }, include: adminWarehouseInclude });
    if (!item) return NextResponse.json({ error: 'کالای انبار پیدا نشد.' }, { status: 404 });
    return NextResponse.json(serializeWarehouseItem(item));
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.WAREHOUSE_EDIT);
  if (response) return response;
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: 'شناسه کالا معتبر نیست.' }, { status: 400 });
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 }); }
  const validated = validateWarehousePayload(body, { partial: true });
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const item = await updateWarehouseItem(prisma, { id, ...validated, adminId: admin.id });
    const archived = validated.data.isArchived === true;
    await logAdminActivity({
      adminId: admin.id,
      action: archived ? 'WAREHOUSE_ITEM_ARCHIVED' : 'WAREHOUSE_ITEM_UPDATED',
      entityType: 'WarehouseItem',
      entityId: id,
      metadata: { changedFields: [...Object.keys(validated.data), ...Object.keys(validated.relations)] },
      request,
    });
    revalidatePublicCatalog();
    return NextResponse.json(serializeWarehouseItem(item));
  } catch (error) { return errorResponse(error); }
}
