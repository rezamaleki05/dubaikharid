-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM (
  'INITIAL_STOCK',
  'STOCK_IN',
  'STOCK_OUT',
  'CORRECTION',
  'RESERVATION_ADJUSTMENT',
  'ORDER_RESERVATION',
  'ORDER_RELEASE',
  'ORDER_FULFILLMENT',
  'RETURN'
);

-- AlterTable
ALTER TABLE "WarehouseItem"
  ADD COLUMN "productId" TEXT,
  ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "InventoryMovement" (
  "id" TEXT NOT NULL,
  "warehouseItemId" TEXT NOT NULL,
  "type" "InventoryMovementType" NOT NULL,
  "quantityChange" INTEGER NOT NULL,
  "quantityBefore" INTEGER NOT NULL,
  "quantityAfter" INTEGER NOT NULL,
  "reservedBefore" INTEGER,
  "reservedAfter" INTEGER,
  "reason" TEXT,
  "orderId" TEXT,
  "adminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseNote" (
  "id" TEXT NOT NULL,
  "warehouseItemId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "adminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseItem_productId_key" ON "WarehouseItem"("productId");
CREATE INDEX "WarehouseItem_isArchived_createdAt_idx" ON "WarehouseItem"("isArchived", "createdAt");
CREATE INDEX "WarehouseItem_brandId_idx" ON "WarehouseItem"("brandId");
CREATE INDEX "WarehouseItem_categoryId_idx" ON "WarehouseItem"("categoryId");
CREATE INDEX "WarehouseItem_stock_idx" ON "WarehouseItem"("stock");
CREATE INDEX "InventoryMovement_warehouseItemId_createdAt_idx" ON "InventoryMovement"("warehouseItemId", "createdAt");
CREATE INDEX "InventoryMovement_orderId_idx" ON "InventoryMovement"("orderId");
CREATE INDEX "InventoryMovement_adminId_createdAt_idx" ON "InventoryMovement"("adminId", "createdAt");
CREATE INDEX "InventoryMovement_type_createdAt_idx" ON "InventoryMovement"("type", "createdAt");
CREATE INDEX "WarehouseNote_warehouseItemId_createdAt_idx" ON "WarehouseNote"("warehouseItemId", "createdAt");
CREATE INDEX "WarehouseNote_adminId_createdAt_idx" ON "WarehouseNote"("adminId", "createdAt");

-- AddForeignKey
ALTER TABLE "WarehouseItem" ADD CONSTRAINT "WarehouseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_warehouseItemId_fkey" FOREIGN KEY ("warehouseItemId") REFERENCES "WarehouseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WarehouseNote" ADD CONSTRAINT "WarehouseNote_warehouseItemId_fkey" FOREIGN KEY ("warehouseItemId") REFERENCES "WarehouseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarehouseNote" ADD CONSTRAINT "WarehouseNote_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
