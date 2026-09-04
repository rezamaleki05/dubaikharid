-- Phase 2F is expand-only: preserve authoritative ProductVariant purchase snapshots
-- while every historical OrderItem and current Warehouse/Laptop/Product path remains valid.
ALTER TYPE "OrderType" ADD VALUE IF NOT EXISTS 'IRAN_STOCK_PRODUCT';

CREATE TYPE "OrderItemSourceKind" AS ENUM (
  'PRODUCT_VARIANT',
  'LAPTOP_UNIT',
  'LEGACY_WAREHOUSE',
  'MANUAL',
  'LEGACY_PRODUCT'
);

ALTER TABLE "OrderItem"
  ADD COLUMN "productVariantId" TEXT,
  ADD COLUMN "sourceKind" "OrderItemSourceKind",
  ADD COLUMN "supplyModeSnapshot" "ProductSupplyMode",
  ADD COLUMN "selectedOptionsSnapshot" JSONB,
  ADD COLUMN "productNameFaSnapshot" TEXT,
  ADD COLUMN "productNameEnSnapshot" TEXT,
  ADD COLUMN "skuSnapshot" TEXT,
  ADD COLUMN "unitPriceAedSnapshot" DECIMAL(12,2),
  ADD COLUMN "unitPriceTomanSnapshot" DECIMAL(18,0),
  ADD COLUMN "discountPercentSnapshot" INTEGER,
  ADD COLUMN "finalUnitPriceTomanSnapshot" DECIMAL(18,0),
  ADD CONSTRAINT "OrderItem_discountPercentSnapshot_range"
    CHECK ("discountPercentSnapshot" IS NULL OR "discountPercentSnapshot" BETWEEN 0 AND 100),
  ADD CONSTRAINT "OrderItem_snapshot_prices_positive"
    CHECK (
      ("unitPriceAedSnapshot" IS NULL OR "unitPriceAedSnapshot" > 0)
      AND ("unitPriceTomanSnapshot" IS NULL OR "unitPriceTomanSnapshot" > 0)
      AND ("finalUnitPriceTomanSnapshot" IS NULL OR "finalUnitPriceTomanSnapshot" > 0)
    ),
  ADD CONSTRAINT "OrderItem_productVariant_snapshot_complete"
    CHECK (
      "sourceKind" IS DISTINCT FROM 'PRODUCT_VARIANT'
      OR (
        "productId" IS NOT NULL
        AND "productVariantId" IS NOT NULL
        AND "supplyModeSnapshot" IS NOT NULL
        AND "selectedOptionsSnapshot" IS NOT NULL
        AND "productNameFaSnapshot" IS NOT NULL
        AND "productNameEnSnapshot" IS NOT NULL
        AND "discountPercentSnapshot" IS NOT NULL
        AND "finalUnitPriceTomanSnapshot" IS NOT NULL
      )
    ),
  ADD CONSTRAINT "OrderItem_selectedOptionsSnapshot_array"
    CHECK ("selectedOptionsSnapshot" IS NULL OR jsonb_typeof("selectedOptionsSnapshot") = 'array');

ALTER TABLE "ProductInventoryReservation"
  ADD COLUMN "orderId" TEXT,
  ADD COLUMN "orderItemId" TEXT,
  ADD CONSTRAINT "ProductInventoryReservation_order_link_pair"
    CHECK (("orderId" IS NULL) = ("orderItemId" IS NULL));

CREATE INDEX "OrderItem_productVariantId_idx" ON "OrderItem"("productVariantId");
CREATE INDEX "OrderItem_sourceKind_idx" ON "OrderItem"("sourceKind");
CREATE INDEX "OrderItem_supplyModeSnapshot_idx" ON "OrderItem"("supplyModeSnapshot");
CREATE INDEX "ProductInventoryReservation_orderId_idx" ON "ProductInventoryReservation"("orderId");
CREATE UNIQUE INDEX "ProductInventoryReservation_orderItemId_key"
  ON "ProductInventoryReservation"("orderItemId");

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_productVariantId_fkey"
  FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductInventoryReservation"
  ADD CONSTRAINT "ProductInventoryReservation_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductInventoryReservation"
  ADD CONSTRAINT "ProductInventoryReservation_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
