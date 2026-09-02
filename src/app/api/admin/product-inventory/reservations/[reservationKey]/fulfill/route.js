import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { productInventoryApiError } from '@/lib/productInventoryApi';
import { validateProductInventoryKey } from '@/lib/productInventoryDomain';
import { fulfillProductInventoryReservation } from '@/lib/productInventoryService';

export async function POST(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const { reservationKey: rawKey } = await params;
  const reservationKey = validateProductInventoryKey(rawKey, 'کلید رزرو');
  if (reservationKey.error) return NextResponse.json({ error: reservationKey.error }, { status: 400 });
  try {
    const reservation = await fulfillProductInventoryReservation(prisma, { reservationKey: reservationKey.value, adminId: admin.id });
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_INVENTORY_RESERVATION_FULFILLED',
      entityType: 'ProductInventoryReservation',
      entityId: reservation.id,
      metadata: { reservationKey: reservation.reservationKey },
      request,
    });
    return NextResponse.json({ reservation });
  } catch (error) {
    return productInventoryApiError(error, 'Product inventory reservation fulfillment failed:');
  }
}
