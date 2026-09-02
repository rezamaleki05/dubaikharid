import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { productInventoryApiError, readProductInventoryJson } from '@/lib/productInventoryApi';
import { validateProductInventoryKey, validateReturnProductInventoryPayload } from '@/lib/productInventoryDomain';
import { returnProductInventory } from '@/lib/productInventoryService';

export async function POST(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const { id: rawId } = await params;
  const inventoryId = validateProductInventoryKey(rawId, 'شناسه موجودی');
  if (inventoryId.error) return NextResponse.json({ error: inventoryId.error }, { status: 400 });
  const parsed = await readProductInventoryJson(request);
  if (parsed.response) return parsed.response;
  const validated = validateReturnProductInventoryPayload(parsed.body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const inventory = await returnProductInventory(prisma, {
      inventoryId: inventoryId.value,
      ...validated.data,
      adminId: admin.id,
    });
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_INVENTORY_RETURNED',
      entityType: 'ProductInventory',
      entityId: inventory.id,
      metadata: { quantity: validated.data.quantity, idempotencyKey: validated.data.idempotencyKey },
      request,
    });
    return NextResponse.json({ inventory });
  } catch (error) {
    return productInventoryApiError(error, 'Product inventory return failed:');
  }
}
