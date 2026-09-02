import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { productInventoryApiError, readProductInventoryJson } from '@/lib/productInventoryApi';
import { validateAdjustProductInventoryPayload, validateProductInventoryKey } from '@/lib/productInventoryDomain';
import { adjustProductInventoryStock } from '@/lib/productInventoryService';

export async function POST(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const { id: rawId } = await params;
  const inventoryId = validateProductInventoryKey(rawId, 'شناسه موجودی');
  if (inventoryId.error) return NextResponse.json({ error: inventoryId.error }, { status: 400 });
  const parsed = await readProductInventoryJson(request);
  if (parsed.response) return parsed.response;
  const validated = validateAdjustProductInventoryPayload(parsed.body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const inventory = await adjustProductInventoryStock(prisma, {
      inventoryId: inventoryId.value,
      ...validated.data,
      adminId: admin.id,
    });
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_INVENTORY_ADJUSTED',
      entityType: 'ProductInventory',
      entityId: inventory.id,
      metadata: { delta: validated.data.delta, idempotencyKey: validated.data.idempotencyKey },
      request,
    });
    return NextResponse.json({ inventory });
  } catch (error) {
    return productInventoryApiError(error, 'Product inventory adjustment failed:');
  }
}
