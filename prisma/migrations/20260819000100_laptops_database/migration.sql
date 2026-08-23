-- Each legacy Laptop row represented a quantity. Preserve every recorded unit by
-- expanding quantities into individual rows before removing the aggregate column.
CREATE TYPE "LaptopStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'INACTIVE');

ALTER TABLE "Laptop"
  ADD COLUMN "serialNumber" TEXT,
  ADD COLUMN "internalSku" TEXT,
  ADD COLUMN "secondaryStorage" TEXT,
  ADD COLUMN "manufactureYear" INTEGER,
  ADD COLUMN "color" TEXT,
  ADD COLUMN "batteryHealth" INTEGER,
  ADD COLUMN "weightKg" DECIMAL(6, 2),
  ADD COLUMN "purchasePriceAed" DECIMAL(12, 2),
  ADD COLUMN "extraCostsAed" DECIMAL(12, 2),
  ADD COLUMN "images" JSONB,
  ADD COLUMN "internalNotes" TEXT,
  ADD COLUMN "hardwareTests" JSONB,
  ADD COLUMN "accessories" JSONB,
  ADD COLUMN "status" "LaptopStatus" NOT NULL DEFAULT 'AVAILABLE',
  ADD COLUMN "dateEntered" TEXT,
  ADD COLUMN "warrantyDays" INTEGER,
  ADD COLUMN "warrantyExpiry" TEXT,
  ADD COLUMN "lastService" TEXT,
  ADD COLUMN "nextService" TEXT,
  ADD COLUMN "soldAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3);

UPDATE "Laptop"
SET "status" = CASE
  WHEN "isActive" = false OR "stock" <= 0 THEN 'INACTIVE'::"LaptopStatus"
  ELSE 'AVAILABLE'::"LaptopStatus"
END;

INSERT INTO "Laptop" (
  "id", "name", "brand", "model", "cpu", "ram", "storage", "gpu", "screen",
  "condition", "priceToman", "image", "description", "status", "createdAt", "updatedAt"
)
SELECT
  source."id" || '-unit-' || unit.number,
  source."name", source."brand", source."model", source."cpu", source."ram",
  source."storage", source."gpu", source."screen", source."condition",
  source."priceToman", source."image", source."description",
  CASE WHEN source."isActive" THEN 'AVAILABLE'::"LaptopStatus" ELSE 'INACTIVE'::"LaptopStatus" END,
  source."createdAt", source."updatedAt"
FROM "Laptop" source
CROSS JOIN LATERAL generate_series(2, GREATEST(source."stock", 1)) AS unit(number)
WHERE source."stock" > 1;

ALTER TABLE "Laptop"
  ALTER COLUMN "priceToman" TYPE DECIMAL(18, 0)
  USING ROUND("priceToman")::DECIMAL(18, 0),
  DROP COLUMN "stock",
  DROP COLUMN "isActive";

CREATE UNIQUE INDEX "Laptop_serialNumber_key" ON "Laptop"("serialNumber");
CREATE UNIQUE INDEX "Laptop_internalSku_key" ON "Laptop"("internalSku");
CREATE INDEX "Laptop_status_createdAt_idx" ON "Laptop"("status", "createdAt");
CREATE INDEX "Laptop_brand_idx" ON "Laptop"("brand");
CREATE INDEX "Laptop_createdAt_idx" ON "Laptop"("createdAt");
