import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { productInventoryApiError } from '@/lib/productInventoryApi';
import { releaseExpiredProductInventoryReservations } from '@/lib/productInventoryService';

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  try {
    const reservations = await releaseExpiredProductInventoryReservations(prisma, new Date(), { adminId: admin.id });
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_INVENTORY_EXPIRED_RESERVATIONS_RELEASED',
      entityType: 'ProductInventoryReservation',
      metadata: { count: reservations.length, reservationKeys: reservations.map(item => item.reservationKey) },
      request,
    });
    return NextResponse.json({ released: reservations.length, reservations });
  } catch (error) {
    return productInventoryApiError(error, 'Expired product inventory release failed:');
  }
}
