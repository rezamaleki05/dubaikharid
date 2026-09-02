-- Phase 2E is expand-only: add independent physical inventory for ProductVariant
-- without changing Product, Warehouse, Laptop, Cart, Order, or OrderItem data.
CREATE TYPE "ProductInventoryReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'FULFILLED');
CREATE TYPE "ProductInventoryMovementType" AS ENUM (
  'STOCK_IN',
  'STOCK_OUT',
  'ADJUSTMENT',
  'ORDER_RESERVATION',
  'ORDER_RELEASE',
  'ORDER_FULFILLMENT',
  'RETURN'
);

CREATE TABLE "ProductInventory" (
  "id" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "reserved" INTEGER NOT NULL DEFAULT 0,
  "minStock" INTEGER NOT NULL DEFAULT 0,
  "location" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductInventory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductInventory_stock_nonnegative" CHECK ("stock" >= 0),
  CONSTRAINT "ProductInventory_reserved_nonnegative" CHECK ("reserved" >= 0),
  CONSTRAINT "ProductInventory_minStock_nonnegative" CHECK ("minStock" >= 0),
  CONSTRAINT "ProductInventory_reserved_within_stock" CHECK ("reserved" <= "stock")
);

CREATE TABLE "ProductInventoryReservation" (
  "id" TEXT NOT NULL,
  "inventoryId" TEXT NOT NULL,
  "reservationKey" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "status" "ProductInventoryReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  "fulfilledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductInventoryReservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductInventoryReservation_quantity_positive" CHECK ("quantity" > 0),
  CONSTRAINT "ProductInventoryReservation_terminal_timestamps" CHECK (
    ("status" = 'ACTIVE' AND "releasedAt" IS NULL AND "fulfilledAt" IS NULL)
    OR ("status" = 'RELEASED' AND "releasedAt" IS NOT NULL AND "fulfilledAt" IS NULL)
    OR ("status" = 'FULFILLED' AND "fulfilledAt" IS NOT NULL AND "releasedAt" IS NULL)
  )
);

CREATE TABLE "ProductInventoryMovement" (
  "id" TEXT NOT NULL,
  "inventoryId" TEXT NOT NULL,
  "reservationId" TEXT,
  "type" "ProductInventoryMovementType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "stockBefore" INTEGER NOT NULL,
  "stockAfter" INTEGER NOT NULL,
  "reservedBefore" INTEGER NOT NULL,
  "reservedAfter" INTEGER NOT NULL,
  "reason" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "adminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductInventoryMovement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductInventoryMovement_counters_nonnegative" CHECK (
    "stockBefore" >= 0 AND "stockAfter" >= 0
    AND "reservedBefore" >= 0 AND "reservedAfter" >= 0
    AND "reservedBefore" <= "stockBefore"
    AND "reservedAfter" <= "stockAfter"
  )
);

CREATE UNIQUE INDEX "ProductInventory_variantId_key" ON "ProductInventory"("variantId");
CREATE INDEX "ProductInventory_stock_idx" ON "ProductInventory"("stock");
CREATE UNIQUE INDEX "ProductInventoryReservation_reservationKey_key"
  ON "ProductInventoryReservation"("reservationKey");
CREATE INDEX "ProductInventoryReservation_inventoryId_idx"
  ON "ProductInventoryReservation"("inventoryId");
CREATE INDEX "ProductInventoryReservation_status_idx"
  ON "ProductInventoryReservation"("status");
CREATE INDEX "ProductInventoryReservation_expiresAt_idx"
  ON "ProductInventoryReservation"("expiresAt");
CREATE UNIQUE INDEX "ProductInventoryMovement_idempotencyKey_key"
  ON "ProductInventoryMovement"("idempotencyKey");
CREATE INDEX "ProductInventoryMovement_inventoryId_createdAt_idx"
  ON "ProductInventoryMovement"("inventoryId", "createdAt");
CREATE INDEX "ProductInventoryMovement_reservationId_idx"
  ON "ProductInventoryMovement"("reservationId");
CREATE INDEX "ProductInventoryMovement_type_createdAt_idx"
  ON "ProductInventoryMovement"("type", "createdAt");
CREATE INDEX "ProductInventoryMovement_adminId_createdAt_idx"
  ON "ProductInventoryMovement"("adminId", "createdAt");

ALTER TABLE "ProductInventory"
  ADD CONSTRAINT "ProductInventory_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductInventoryReservation"
  ADD CONSTRAINT "ProductInventoryReservation_inventoryId_fkey"
  FOREIGN KEY ("inventoryId") REFERENCES "ProductInventory"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductInventoryMovement"
  ADD CONSTRAINT "ProductInventoryMovement_inventoryId_fkey"
  FOREIGN KEY ("inventoryId") REFERENCES "ProductInventory"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductInventoryMovement"
  ADD CONSTRAINT "ProductInventoryMovement_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "ProductInventoryReservation"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductInventoryMovement"
  ADD CONSTRAINT "ProductInventoryMovement_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
