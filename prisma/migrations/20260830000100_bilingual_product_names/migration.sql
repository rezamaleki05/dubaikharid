-- Product is intentionally empty in Production at the time of this migration.
-- Abort instead of discarding or ambiguously translating any unexpected rows.
LOCK TABLE "Product" IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Product" LIMIT 1) THEN
    RAISE EXCEPTION '20260830000100_bilingual_product_names requires an empty Product table';
  END IF;
END $$;

ALTER TABLE "Product"
  DROP COLUMN "name",
  ADD COLUMN "nameFa" TEXT NOT NULL,
  ADD COLUMN "nameEn" TEXT NOT NULL;
