-- Preserve the warehouse UI's more specific category keys independently of the
-- broader catalog Category relation (for example clothing -> fashion).
ALTER TABLE "WarehouseItem" ADD COLUMN "categoryKey" TEXT;
CREATE INDEX "WarehouseItem_categoryKey_idx" ON "WarehouseItem"("categoryKey");
