import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { productInventoryApiError } from '@/lib/productInventoryApi';
import { validateProductInventoryKey } from '@/lib/productInventoryDomain';
import { listProductInventoryMovements } from '@/lib/productInventoryService';

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_VIEW);
  if (response) return response;
  const { id: rawId } = await params;
  const inventoryId = validateProductInventoryKey(rawId, 'شناسه موجودی');
  if (inventoryId.error) return NextResponse.json({ error: inventoryId.error }, { status: 400 });
  try {
    const take = new URL(request.url).searchParams.get('take');
    return NextResponse.json({ movements: await listProductInventoryMovements(prisma, inventoryId.value, { take }) });
  } catch (error) {
    return productInventoryApiError(error, 'Product inventory movement list failed:');
  }
}
