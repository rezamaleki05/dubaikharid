import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

const ACTION_PERMISSIONS = Object.freeze({
  ORDER_STATUS_CHANGED: ADMIN_PERMISSIONS.ORDERS_EDIT,
  ORDER_DELETED: ADMIN_PERMISSIONS.ORDERS_DELETE,
  PRODUCT_CREATED: ADMIN_PERMISSIONS.PRODUCTS_CREATE,
  PRODUCT_UPDATED: ADMIN_PERMISSIONS.PRODUCTS_EDIT,
  PRODUCT_DELETED: ADMIN_PERMISSIONS.PRODUCTS_DELETE,
  PAYMENT_UPDATED: ADMIN_PERMISSIONS.PAYMENTS_EDIT,
  SETTINGS_UPDATED: ADMIN_PERMISSIONS.SETTINGS_EDIT,
});

export async function POST(request) {
  const body = await request.json();
  const action = typeof body?.action === 'string' ? body.action : '';
  const permission = ACTION_PERMISSIONS[action];

  if (!permission) {
    return NextResponse.json({ error: 'Invalid activity action' }, { status: 400 });
  }

  const { admin, response } = await authorizeAdminApiRequest(request, permission);
  if (response) return response;

  const entityType = typeof body?.entityType === 'string' ? body.entityType.slice(0, 80) : null;
  const entityId = typeof body?.entityId === 'string' ? body.entityId.slice(0, 120) : null;
  let metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : null;
  if (metadata && JSON.stringify(metadata).length > 2000) metadata = null;

  await logAdminActivity({ adminId: admin.id, action, entityType, entityId, metadata, request });
  return NextResponse.json({ success: true }, { status: 201 });
}
