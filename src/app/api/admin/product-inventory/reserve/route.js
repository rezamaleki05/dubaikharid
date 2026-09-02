import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { productInventoryApiError, readProductInventoryJson } from '@/lib/productInventoryApi';
import {
  validateReserveProductInventoryLinesPayload,
  validateReserveProductInventoryPayload,
} from '@/lib/productInventoryDomain';
import { reserveProductInventory, reserveProductInventoryLines } from '@/lib/productInventoryService';

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const parsed = await readProductInventoryJson(request);
  if (parsed.response) return parsed.response;
  const isGroup = Array.isArray(parsed.body?.lines);
  const validated = isGroup
    ? validateReserveProductInventoryLinesPayload(parsed.body)
    : validateReserveProductInventoryPayload(parsed.body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const reservations = isGroup
      ? await reserveProductInventoryLines(prisma, { ...validated.data, adminId: admin.id })
      : [await reserveProductInventory(prisma, { ...validated.data, adminId: admin.id })];
    await logAdminActivity({
      adminId: admin.id,
      action: isGroup ? 'PRODUCT_INVENTORY_GROUP_RESERVED' : 'PRODUCT_INVENTORY_RESERVED',
      entityType: 'ProductInventoryReservation',
      entityId: reservations[0].id,
      metadata: { reservationKeys: reservations.map(item => item.reservationKey) },
      request,
    });
    return NextResponse.json({ reservations }, { status: 201 });
  } catch (error) {
    return productInventoryApiError(error, 'Product inventory reservation failed:');
  }
}
