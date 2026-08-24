-- Keep every existing brand visible so the current public directory does not
-- change merely because this additive migration is deployed.
ALTER TABLE "Brand"
ADD COLUMN "showInBrandDirectory" BOOLEAN NOT NULL DEFAULT true;

-- Explicit many-to-many mapping. Existing Product.brandId,
-- Product.categoryId and WarehouseItem relations remain untouched.
CREATE TABLE "BrandCategory" (
    "brandId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "BrandCategory_pkey" PRIMARY KEY ("brandId", "categoryId")
);

CREATE INDEX "BrandCategory_categoryId_idx" ON "BrandCategory"("categoryId");

ALTER TABLE "BrandCategory"
ADD CONSTRAINT "BrandCategory_brandId_fkey"
FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BrandCategory"
ADD CONSTRAINT "BrandCategory_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve the useful part of the legacy Brand.cat grouping by associating
-- exact normalized category-name matches. Unmatched legacy values stay intact.
INSERT INTO "BrandCategory" ("brandId", "categoryId")
SELECT b."id", c."id"
FROM "Brand" b
JOIN "Category" c
  ON LOWER(BTRIM(b."cat")) = LOWER(BTRIM(c."name"))
WHERE b."cat" IS NOT NULL
ON CONFLICT ("brandId", "categoryId") DO NOTHING;
