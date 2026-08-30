-- Expand phase: Product is intentionally empty in Production at the time of this migration.
-- Abort instead of adding required bilingual columns to any unexpected legacy rows.
-- The legacy "name" column remains temporarily for compatibility with the previous deployment.
LOCK TABLE "Product" IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Product" LIMIT 1) THEN
    RAISE EXCEPTION '20260830000100_bilingual_product_names requires an empty Product table';
  END IF;
END $$;

ALTER TABLE "Product"
  ADD COLUMN "nameFa" TEXT NOT NULL,
  ADD COLUMN "nameEn" TEXT NOT NULL;
