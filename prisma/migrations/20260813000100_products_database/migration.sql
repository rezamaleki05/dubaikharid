-- Product source prices are authoritative AED values. Numeric avoids floating-point
-- storage errors while preserving the two existing records without destructive reset.
ALTER TABLE "Product"
ALTER COLUMN "priceAed" TYPE DECIMAL(12,2)
USING ROUND("priceAed"::numeric, 2);

ALTER TABLE "Product" ADD COLUMN "sourceUrlKey" TEXT;

-- Existing exact URLs were checked for duplicates before this migration.
UPDATE "Product"
SET "sourceUrlKey" = "originalLink"
WHERE "originalLink" IS NOT NULL AND BTRIM("originalLink") <> '';

CREATE UNIQUE INDEX "Product_sourceUrlKey_key" ON "Product"("sourceUrlKey");
CREATE INDEX "Product_status_createdAt_idx" ON "Product"("status", "createdAt");
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_storeId_idx" ON "Product"("storeId");
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");
