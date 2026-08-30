-- CreateTable
CREATE TABLE "WarehouseItemImage" (
    "id" TEXT NOT NULL,
    "warehouseItemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseItemImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WarehouseItemImage_warehouseItemId_sortOrder_idx" ON "WarehouseItemImage"("warehouseItemId", "sortOrder");

-- CreateIndex
CREATE INDEX "WarehouseItemImage_warehouseItemId_isPrimary_idx" ON "WarehouseItemImage"("warehouseItemId", "isPrimary");

-- Only one image may be selected as the cover for a warehouse item.
CREATE UNIQUE INDEX "WarehouseItemImage_one_primary_per_item" ON "WarehouseItemImage"("warehouseItemId") WHERE "isPrimary" = true;

-- AddForeignKey
ALTER TABLE "WarehouseItemImage" ADD CONSTRAINT "WarehouseItemImage_warehouseItemId_fkey" FOREIGN KEY ("warehouseItemId") REFERENCES "WarehouseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
