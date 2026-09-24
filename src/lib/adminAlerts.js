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
  const [orders, purchaseRequests, payments, inventoryRows, shipments] = await Promise.all([
    client.order.count({ where: { status: { in: ACTIONABLE_ORDER_STATUSES } } }),
    client.purchaseRequest.count({ where: { status: { in: ACTIONABLE_PURCHASE_REQUEST_STATUSES } } }),
    client.payment.count({ where: { status: 'pending' } }),
    client.$queryRaw`SELECT COUNT(*)::int AS "count"
      FROM "ProductInventory" inventory
      INNER JOIN "ProductVariant" variant ON variant."id" = inventory."variantId"
      INNER JOIN "Product" product ON product."id" = variant."productId"
      WHERE product."supplyMode" = 'IRAN_STOCK'::"ProductSupplyMode"
        AND variant."isActive" = true
        AND inventory."stock" - inventory."reserved" <= inventory."minStock"`,
    client.shipment.count({ where: { status: { in: ACTIONABLE_SHIPMENT_STATUSES } } }),
  ]);

  const counts = buildAdminAlertCounts({
    orders,
    purchaseRequests,
    payments,
    inventory: inventoryRows[0]?.count || 0,
    shipments,
  });

  return {
    generatedAt: new Date(),
    counts,
    items: buildAdminAlertItems(counts),
  };
}
