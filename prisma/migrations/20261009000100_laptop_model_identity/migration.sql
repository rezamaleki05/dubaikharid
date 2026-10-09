-- Additive only. Legacy identities and catalog families are deliberately not backfilled.
ALTER TABLE "Laptop"
  ADD COLUMN "series" TEXT,
  ADD COLUMN "displayNameFa" TEXT,
  ADD COLUMN "displayNameEn" TEXT,
  ADD COLUMN "previousModelSlugs" JSONB;
ALTER TABLE "LaptopModel"
  ADD COLUMN "series" TEXT,
  ADD COLUMN "exactModel" TEXT;
