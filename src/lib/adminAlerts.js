import 'server-only';

import { prisma } from '@/lib/prisma';
import {
  ACTIONABLE_ORDER_STATUSES,
  ACTIONABLE_PURCHASE_REQUEST_STATUSES,
  ACTIONABLE_SHIPMENT_STATUSES,
  buildAdminAlertCounts,
  buildAdminAlertItems,
} from '@/lib/adminAlertRules';

export async function getAdminAlertSummary(client = prisma) {
  const [orders, purchaseRequests, payments, warehouseRows, shipments] = await Promise.all([
    client.order.count({ where: { status: { in: ACTIONABLE_ORDER_STATUSES } } }),
    client.purchaseRequest.count({ where: { status: { in: ACTIONABLE_PURCHASE_REQUEST_STATUSES } } }),
    client.payment.count({ where: { status: 'pending' } }),
    client.$queryRaw`SELECT COUNT(*)::int AS "count" FROM "WarehouseItem" WHERE "isArchived" = false AND "stock" <= "minStock"`,
    client.shipment.count({ where: { status: { in: ACTIONABLE_SHIPMENT_STATUSES } } }),
  ]);

  const counts = buildAdminAlertCounts({
    orders,
    purchaseRequests,
    payments,
    warehouse: warehouseRows[0]?.count || 0,
    shipments,
  });

  return {
    generatedAt: new Date(),
    counts,
    items: buildAdminAlertItems(counts),
  };
}
