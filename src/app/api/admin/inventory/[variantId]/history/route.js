import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { getAdminProductInventoryHistory } from '@/lib/adminProductInventoryService';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { productInventoryApiError } from '@/lib/productInventoryApi';
import { validateProductInventoryKey } from '@/lib/productInventoryDomain';

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_VIEW);
  if (response) return response;
  const { variantId: rawVariantId } = await params;
  const variantId = validateProductInventoryKey(rawVariantId, 'شناسه تنوع');
  if (variantId.error) return NextResponse.json({ error: variantId.error }, { status: 400 });
  try {
    return NextResponse.json(await getAdminProductInventoryHistory(prisma, variantId.value));
  } catch (error) {
    return productInventoryApiError(error, 'Admin product inventory history failed:');
  }
}
