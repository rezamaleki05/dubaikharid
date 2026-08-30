-- Expand-only migration: no existing columns or data are removed.
ALTER TYPE "OrderType" ADD VALUE 'WAREHOUSE_STOCK';

ALTER TABLE "WarehouseItem"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "publicNameEn" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publishedAt" TIMESTAMP(3);

ALTER TABLE "OrderItem"
  ADD COLUMN "warehouseItemId" TEXT;

ALTER TABLE "Brand"
  ADD COLUMN "supportsLaptop" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "LaptopModel" (
  "id" TEXT NOT NULL,
  "brandId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LaptopModel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WarehouseItem_slug_key" ON "WarehouseItem"("slug");
CREATE INDEX "WarehouseItem_isPublished_isArchived_createdAt_idx" ON "WarehouseItem"("isPublished", "isArchived", "createdAt");
CREATE INDEX "OrderItem_warehouseItemId_idx" ON "OrderItem"("warehouseItemId");
CREATE UNIQUE INDEX "LaptopModel_brandId_name_key" ON "LaptopModel"("brandId", "name");
CREATE INDEX "LaptopModel_brandId_active_idx" ON "LaptopModel"("brandId", "active");

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_warehouseItemId_fkey"
  FOREIGN KEY ("warehouseItemId") REFERENCES "WarehouseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LaptopModel"
  ADD CONSTRAINT "LaptopModel_brandId_fkey"
  FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Classify matching real brands without changing their public-directory behavior.
UPDATE "Brand"
SET "supportsLaptop" = true
WHERE LOWER(BTRIM("name")) IN ('apple', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'msi', 'microsoft');

-- Add missing standard laptop brands. Existing brands are never overwritten or deleted.
INSERT INTO "Brand" ("id", "name", "faName", "cat", "hasImage", "showInBrandDirectory", "supportsLaptop")
SELECT seed."id", seed."name", seed."faName", 'تکنولوژی', false, false, true
FROM (VALUES
  ('laptop-brand-apple', 'Apple', 'اپل'),
  ('laptop-brand-dell', 'Dell', 'دل'),
  ('laptop-brand-hp', 'HP', 'اچ‌پی'),
  ('laptop-brand-lenovo', 'Lenovo', 'لنوو'),
  ('laptop-brand-asus', 'ASUS', 'ایسوس'),
  ('laptop-brand-acer', 'Acer', 'ایسر'),
  ('laptop-brand-msi', 'MSI', 'ام‌اس‌آی'),
  ('laptop-brand-microsoft', 'Microsoft', 'مایکروسافت')
) AS seed("id", "name", "faName")
WHERE NOT EXISTS (
  SELECT 1 FROM "Brand" current
  WHERE LOWER(BTRIM(current."name")) = LOWER(seed."name")
);

-- Seed only a small maintainable starter model set; admins can add more later.
INSERT INTO "LaptopModel" ("id", "brandId", "name", "updatedAt")
SELECT CONCAT('laptop-model-', brand."id", '-', seed."modelKey"), brand."id", seed."modelName", CURRENT_TIMESTAMP
FROM (VALUES
  ('Apple', 'macbook-air', 'MacBook Air'),
  ('Apple', 'macbook-pro', 'MacBook Pro'),
  ('Dell', 'latitude', 'Latitude'),
  ('Dell', 'precision', 'Precision'),
  ('Dell', 'xps', 'XPS'),
  ('HP', 'elitebook', 'EliteBook'),
  ('HP', 'probook', 'ProBook'),
  ('Lenovo', 'thinkpad', 'ThinkPad'),
  ('Lenovo', 'yoga', 'Yoga'),
  ('ASUS', 'zenbook', 'ZenBook'),
  ('ASUS', 'vivobook', 'VivoBook'),
  ('Acer', 'aspire', 'Aspire'),
  ('MSI', 'modern', 'Modern'),
  ('Microsoft', 'surface-laptop', 'Surface Laptop')
) AS seed("brandName", "modelKey", "modelName")
JOIN "Brand" brand ON LOWER(BTRIM(brand."name")) = LOWER(seed."brandName")
ON CONFLICT ("brandId", "name") DO NOTHING;
