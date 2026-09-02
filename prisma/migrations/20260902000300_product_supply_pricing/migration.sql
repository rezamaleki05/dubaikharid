-- Phase 2D is expand-compatible with the currently deployed application:
-- existing Products retain external pricing, new fields are nullable/defaulted,
-- and relaxing priceAed nullability does not alter any existing value.
CREATE TYPE "ProductSupplyMode" AS ENUM ('EXTERNAL_DUBAI', 'IRAN_STOCK');

ALTER TABLE "Product"
  ALTER COLUMN "priceAed" DROP NOT NULL,
  ADD COLUMN "priceToman" DECIMAL(18, 0),
  ADD COLUMN "supplyMode" "ProductSupplyMode" NOT NULL DEFAULT 'EXTERNAL_DUBAI';

ALTER TABLE "ProductVariant"
  ADD COLUMN "priceAedOverride" DECIMAL(12, 2),
  ADD COLUMN "priceTomanOverride" DECIMAL(18, 0),
  ADD COLUMN "discountPercentOverride" INTEGER,
  ADD COLUMN "weightOverride" DOUBLE PRECISION;

ALTER TABLE "ProductVariant"
  ADD CONSTRAINT "ProductVariant_discountPercentOverride_range"
  CHECK ("discountPercentOverride" IS NULL OR "discountPercentOverride" BETWEEN 0 AND 100);
