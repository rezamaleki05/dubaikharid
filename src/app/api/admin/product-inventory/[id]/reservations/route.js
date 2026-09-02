import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { productInventoryApiError } from '@/lib/productInventoryApi';
import {
  PRODUCT_INVENTORY_RESERVATION_STATUSES,
  validateProductInventoryKey,
} from '@/lib/productInventoryDomain';
import { listProductInventoryReservations } from '@/lib/productInventoryService';

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_VIEW);
  if (response) return response;
  const { id: rawId } = await params;
  const inventoryId = validateProductInventoryKey(rawId, 'شناسه موجودی');
  if (inventoryId.error) return NextResponse.json({ error: inventoryId.error }, { status: 400 });
  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get('status');
  if (status && !PRODUCT_INVENTORY_RESERVATION_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'وضعیت رزرو معتبر نیست.' }, { status: 400 });
  }
  try {
    return NextResponse.json({
      reservations: await listProductInventoryReservations(prisma, inventoryId.value, {
        status,
        take: searchParams.get('take'),
      }),
    });
  } catch (error) {
    return productInventoryApiError(error, 'Product inventory reservation list failed:');
  }
}
