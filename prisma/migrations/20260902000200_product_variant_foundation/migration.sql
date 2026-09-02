-- Phase 2C is expand-only: add stable Product variant identities without changing
-- Product pricing, publication, Cart, Order, Warehouse, Laptop, or inventory data.
CREATE TABLE "ProductVariant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sku" TEXT,
  "optionSignature" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductVariant_default_signature_consistency" CHECK (
    "isDefault" = ("optionSignature" = '__default__')
  )
);

CREATE TABLE "ProductVariantOption" (
  "variantId" TEXT NOT NULL,
  "attributeId" TEXT NOT NULL,
  "attributeOptionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductVariantOption_pkey" PRIMARY KEY ("variantId", "attributeId")
);

CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE UNIQUE INDEX "ProductVariant_productId_optionSignature_key"
  ON "ProductVariant"("productId", "optionSignature");
CREATE UNIQUE INDEX "ProductVariant_one_default_per_product"
  ON "ProductVariant"("productId")
  WHERE "isDefault" = true;
CREATE INDEX "ProductVariant_productId_isActive_idx"
  ON "ProductVariant"("productId", "isActive");
CREATE INDEX "ProductVariant_productId_sortOrder_idx"
  ON "ProductVariant"("productId", "sortOrder");
CREATE INDEX "ProductVariantOption_attributeId_idx"
  ON "ProductVariantOption"("attributeId");
CREATE INDEX "ProductVariantOption_attributeOptionId_idx"
  ON "ProductVariantOption"("attributeOptionId");

ALTER TABLE "ProductVariant"
  ADD CONSTRAINT "ProductVariant_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductVariantOption"
  ADD CONSTRAINT "ProductVariantOption_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductVariantOption"
  ADD CONSTRAINT "ProductVariantOption_attributeId_fkey"
  FOREIGN KEY ("attributeId") REFERENCES "CatalogAttribute"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductVariantOption"
  ADD CONSTRAINT "ProductVariantOption_attributeOptionId_attributeId_fkey"
  FOREIGN KEY ("attributeOptionId", "attributeId")
  REFERENCES "AttributeOption"("id", "attributeId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Deterministic, idempotent backfill: every pre-existing Product receives exactly
-- one default variant, while every Product field remains untouched.
INSERT INTO "ProductVariant" (
  "id",
  "productId",
  "sku",
  "optionSignature",
  "isDefault",
  "isActive",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
SELECT
  'pv_default_' || p."id",
  p."id",
  NULL,
  '__default__',
  true,
  true,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Product" p
WHERE NOT EXISTS (
  SELECT 1
  FROM "ProductVariant" existing
  WHERE existing."productId" = p."id"
    AND existing."optionSignature" = '__default__'
)
ON CONFLICT ("productId", "optionSignature") DO NOTHING;
