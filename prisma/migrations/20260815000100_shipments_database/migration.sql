-- Normalize the legacy free-text shipment status without deleting existing rows.
CREATE TYPE "ShipmentStatus" AS ENUM (
  'PENDING',
  'READY',
  'SHIPPED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED',
  'CANCELLED'
);

ALTER TABLE "Shipment"
  ADD COLUMN "recipientPhone" TEXT,
  ADD COLUMN "deliveryAddress" TEXT,
  ADD COLUMN "carrier" TEXT,
  ADD COLUMN "trackingUrl" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "deliveredAt" TIMESTAMP(3);

-- Preserve the best timestamp information available for legacy rows.
UPDATE "Shipment"
SET "dateUpdated" = COALESCE("dateUpdated", "createdAt");

UPDATE "Shipment"
SET "dateShipped" = COALESCE("dateShipped", "createdAt")
WHERE lower("status") IN ('shipped', 'transit', 'customs', 'iran', 'delivered', 'in_transit', 'out_for_delivery');

UPDATE "Shipment"
SET "deliveredAt" = COALESCE("deliveredAt", "dateShipped", "createdAt")
WHERE lower("status") = 'delivered';

ALTER TABLE "Shipment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Shipment"
  ALTER COLUMN "status" TYPE "ShipmentStatus"
  USING (
    CASE lower("status")
      WHEN 'pending' THEN 'PENDING'
      WHEN 'ready' THEN 'READY'
      WHEN 'shipped' THEN 'SHIPPED'
      WHEN 'transit' THEN 'SHIPPED'
      WHEN 'in_transit' THEN 'IN_TRANSIT'
      WHEN 'customs' THEN 'IN_TRANSIT'
      WHEN 'out_for_delivery' THEN 'OUT_FOR_DELIVERY'
      WHEN 'iran' THEN 'OUT_FOR_DELIVERY'
      WHEN 'delivered' THEN 'DELIVERED'
      WHEN 'failed' THEN 'FAILED'
      WHEN 'problem' THEN 'FAILED'
      WHEN 'cancelled' THEN 'CANCELLED'
      ELSE 'PENDING'
    END
  )::"ShipmentStatus";
ALTER TABLE "Shipment" ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "Shipment" ALTER COLUMN "dateUpdated" SET NOT NULL;
ALTER TABLE "Shipment" ALTER COLUMN "dateUpdated" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Shipment" DROP CONSTRAINT "Shipment_orderId_fkey";
ALTER TABLE "Shipment"
  ADD CONSTRAINT "Shipment_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Shipment_status_createdAt_idx" ON "Shipment"("status", "createdAt");
CREATE INDEX "Shipment_trackingCode_idx" ON "Shipment"("trackingCode");
CREATE INDEX "Shipment_carrier_idx" ON "Shipment"("carrier");
