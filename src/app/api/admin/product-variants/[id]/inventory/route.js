import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { productInventoryApiError, readProductInventoryJson } from '@/lib/productInventoryApi';
import { validateInitializeProductInventoryPayload } from '@/lib/productInventoryDomain';
import { getProductInventoryByVariant, initializeProductInventory } from '@/lib/productInventoryService';
import { validateProductVariantEntityId } from '@/lib/productVariantDomain';

async function readVariantId(params) {
  const { id } = await params;
  return validateProductVariantEntityId(id, 'شناسه تنوع');
}

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_VIEW);
  if (response) return response;
  const variantId = await readVariantId(params);
  if (variantId.error) return NextResponse.json({ error: variantId.error }, { status: 400 });
  try {
    return NextResponse.json(await getProductInventoryByVariant(prisma, variantId.value));
  } catch (error) {
    return productInventoryApiError(error, 'Product inventory read failed:');
  }
}

export async function POST(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const variantId = await readVariantId(params);
  if (variantId.error) return NextResponse.json({ error: variantId.error }, { status: 400 });
  const parsed = await readProductInventoryJson(request);
  if (parsed.response) return parsed.response;
  const validated = validateInitializeProductInventoryPayload(parsed.body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const inventory = await initializeProductInventory(prisma, {
      variantId: variantId.value,
      ...validated.data,
      adminId: admin.id,
    });
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_INVENTORY_INITIALIZED',
      entityType: 'ProductInventory',
      entityId: inventory.id,
      metadata: { variantId: variantId.value, stock: inventory.stock, minStock: inventory.minStock },
      request,
    });
    return NextResponse.json({ inventory }, { status: 201 });
  } catch (error) {
    return productInventoryApiError(error, 'Product inventory initialization failed:');
  }
}
