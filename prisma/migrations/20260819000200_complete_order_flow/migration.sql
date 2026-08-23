-- Preserve all existing orders while adding explicit source and pricing semantics.
CREATE TYPE "OrderType" AS ENUM ('EXTERNAL_PURCHASE', 'CATALOG_PRODUCT', 'LAPTOP_STOCK', 'MANUAL_ADMIN');
CREATE TYPE "PricingStatus" AS ENUM ('ESTIMATED', 'CONFIRMED');

ALTER TABLE "PurchaseRequest"
  ADD COLUMN "requestCode" TEXT,
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "deliveryAddress" TEXT;

ALTER TABLE "Order"
  ADD COLUMN "type" "OrderType" NOT NULL DEFAULT 'MANUAL_ADMIN',
  ADD COLUMN "pricingStatus" "PricingStatus" NOT NULL DEFAULT 'CONFIRMED',
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "purchaseRequestId" TEXT,
  ADD COLUMN "customerNameSnapshot" TEXT,
  ADD COLUMN "customerPhoneSnapshot" TEXT,
  ADD COLUMN "customerEmailSnapshot" TEXT,
  ADD COLUMN "deliveryAddress" TEXT,
  ADD COLUMN "exchangeRate" DECIMAL(12,2),
  ADD COLUMN "commissionPercent" DECIMAL(7,4),
  ADD COLUMN "shippingPerKgAed" DECIMAL(12,2),
  ADD COLUMN "productSubtotalToman" DECIMAL(18,0),
  ADD COLUMN "shippingCostToman" DECIMAL(18,0);

ALTER TABLE "OrderItem"
  ADD COLUMN "productId" TEXT,
  ADD COLUMN "laptopId" TEXT,
  ADD COLUMN "selectedColor" TEXT,
  ADD COLUMN "selectedSize" TEXT,
  ADD COLUMN "weight" DOUBLE PRECISION;

ALTER TABLE "Laptop" ADD COLUMN "reservedOrderId" TEXT;

CREATE UNIQUE INDEX "PurchaseRequest_requestCode_key" ON "PurchaseRequest"("requestCode");
CREATE UNIQUE INDEX "PurchaseRequest_idempotencyKey_key" ON "PurchaseRequest"("idempotencyKey");
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE UNIQUE INDEX "Order_purchaseRequestId_key" ON "Order"("purchaseRequestId");
CREATE INDEX "Order_type_createdAt_idx" ON "Order"("type", "createdAt");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX "OrderItem_laptopId_idx" ON "OrderItem"("laptopId");
CREATE INDEX "Laptop_reservedOrderId_idx" ON "Laptop"("reservedOrderId");

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_purchaseRequestId_fkey"
  FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_laptopId_fkey"
  FOREIGN KEY ("laptopId") REFERENCES "Laptop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Laptop"
  ADD CONSTRAINT "Laptop_reservedOrderId_fkey"
  FOREIGN KEY ("reservedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
