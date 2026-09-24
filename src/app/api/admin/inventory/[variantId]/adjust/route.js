import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { validateAdminInventoryAdjustment } from '@/lib/adminProductInventoryDomain';
import { adjustAdminProductInventory } from '@/lib/adminProductInventoryService';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { productInventoryApiError, readProductInventoryJson } from '@/lib/productInventoryApi';
import { validateProductInventoryKey } from '@/lib/productInventoryDomain';

export async function POST(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const { variantId: rawVariantId } = await params;
  const variantId = validateProductInventoryKey(rawVariantId, 'شناسه تنوع');
  if (variantId.error) return NextResponse.json({ error: variantId.error }, { status: 400 });
  const parsed = await readProductInventoryJson(request);
  if (parsed.response) return parsed.response;
  const validated = validateAdminInventoryAdjustment(parsed.body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const result = await adjustAdminProductInventory(prisma, variantId.value, validated.data, admin.id);
    if (!result.replayed) {
      await logAdminActivity({
        adminId: admin.id,
        action: 'PRODUCT_INVENTORY_ADJUSTED',
        entityType: 'ProductInventory',
        entityId: result.inventory.id,
        metadata: {
          productId: result.productId,
          productVariantId: variantId.value,
          delta: result.delta,
          reasonCode: validated.data.reasonCode,
        },
        request,
      });
    }
    return NextResponse.json(result);
  } catch (error) {
    return productInventoryApiError(error, 'Admin product inventory adjustment failed:');
  }
}
