BEGIN;
-- Existing rows remain shared (NULL). No image, order, or inventory data is rewritten.
ALTER TABLE "ProductImage" ADD COLUMN "colorOptionId" TEXT;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_colorOptionId_fkey"
  FOREIGN KEY ("colorOptionId") REFERENCES "AttributeOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "ProductImage_productId_colorOptionId_sortOrder_idx"
  ON "ProductImage"("productId", "colorOptionId", "sortOrder");
-- Replace the old product-wide constraint with one cover per gallery.
DROP INDEX "ProductImage_one_primary_per_product";
CREATE UNIQUE INDEX "ProductImage_one_primary_per_shared_gallery"
  ON "ProductImage"("productId") WHERE "isPrimary" = true AND "colorOptionId" IS NULL;
CREATE UNIQUE INDEX "ProductImage_one_primary_per_color_gallery"
  ON "ProductImage"("productId", "colorOptionId") WHERE "isPrimary" = true AND "colorOptionId" IS NOT NULL;

COMMIT;
