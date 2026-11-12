-- CreateEnum
CREATE TYPE "AccessoryAuthenticity" AS ENUM ('ORIGINAL', 'OEM', 'COMPATIBLE', 'AFTERMARKET');

-- CreateEnum
CREATE TYPE "AccessoryCondition" AS ENUM ('NEW', 'USED');

-- CreateTable
CREATE TABLE "LaptopAccessoryProfile" (
    "productId" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "partNumber" TEXT,
    "modelNumber" TEXT,
    "shortTechnicalName" TEXT,
    "compatibilityNotes" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaptopAccessoryProfile_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "LaptopAccessoryCompatibility" (
    "productId" TEXT NOT NULL,
    "laptopModelId" TEXT NOT NULL,

    CONSTRAINT "LaptopAccessoryCompatibility_pkey" PRIMARY KEY ("productId","laptopModelId")
);

-- CreateTable
CREATE TABLE "LaptopAccessoryOfferDetail" (
    "variantId" TEXT NOT NULL,
    "authenticity" "AccessoryAuthenticity" NOT NULL,
    "condition" "AccessoryCondition" NOT NULL,
    "grade" TEXT,
    "healthPercent" INTEGER,
    "cycleCount" INTEGER,
    "powerOnHours" INTEGER,
    "smartStatus" TEXT,
    "tested" BOOLEAN,
    "testNotes" TEXT,
    "warrantyDays" INTEGER,
    "manufactureDate" TIMESTAMP(3),
    "offerNotes" TEXT,

    CONSTRAINT "LaptopAccessoryOfferDetail_pkey" PRIMARY KEY ("variantId")
);

-- CreateTable
CREATE TABLE "ProductVariantImage" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "blobPathname" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "altFa" TEXT,
    "altEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LaptopAccessoryProfile_categorySlug_idx" ON "LaptopAccessoryProfile"("categorySlug");

-- CreateIndex
CREATE INDEX "LaptopAccessoryProfile_partNumber_idx" ON "LaptopAccessoryProfile"("partNumber");

-- CreateIndex
CREATE INDEX "LaptopAccessoryProfile_modelNumber_idx" ON "LaptopAccessoryProfile"("modelNumber");

-- CreateIndex
CREATE INDEX "LaptopAccessoryCompatibility_laptopModelId_idx" ON "LaptopAccessoryCompatibility"("laptopModelId");

-- CreateIndex
CREATE INDEX "LaptopAccessoryOfferDetail_authenticity_condition_idx" ON "LaptopAccessoryOfferDetail"("authenticity", "condition");

-- CreateIndex
CREATE INDEX "ProductVariantImage_variantId_sortOrder_idx" ON "ProductVariantImage"("variantId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductVariantImage_variantId_isPrimary_idx" ON "ProductVariantImage"("variantId", "isPrimary");

-- CreateIndex
CREATE INDEX "ProductVariantImage_blobPathname_idx" ON "ProductVariantImage"("blobPathname");

-- AddForeignKey
ALTER TABLE "LaptopAccessoryProfile" ADD CONSTRAINT "LaptopAccessoryProfile_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaptopAccessoryCompatibility" ADD CONSTRAINT "LaptopAccessoryCompatibility_productId_fkey" FOREIGN KEY ("productId") REFERENCES "LaptopAccessoryProfile"("productId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaptopAccessoryCompatibility" ADD CONSTRAINT "LaptopAccessoryCompatibility_laptopModelId_fkey" FOREIGN KEY ("laptopModelId") REFERENCES "LaptopModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaptopAccessoryOfferDetail" ADD CONSTRAINT "LaptopAccessoryOfferDetail_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantImage" ADD CONSTRAINT "ProductVariantImage_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Preserve Product outbox semantics; separate opt-in for accessories.
CREATE OR REPLACE FUNCTION "telegram_enqueue_first_publish"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE destination TEXT;
BEGIN
  IF NEW."status" <> 'active' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD."telegramFirstPublishedAt" IS NOT NULL THEN RETURN NEW; END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Setting" WHERE "key" = 'telegramEnabled' AND "value" = 'true')
     OR NOT EXISTS (SELECT 1 FROM "Setting" WHERE "key" = CASE WHEN EXISTS (SELECT 1 FROM "LaptopAccessoryProfile" WHERE "productId" = NEW."id") THEN 'telegramAutoPublishLaptopAccessories' ELSE 'telegramAutoPublishProducts' END AND "value" = 'true') THEN
    RETURN NEW;
  END IF;
  SELECT trim("value") INTO destination FROM "Setting" WHERE "key" = 'telegramChannel';
  INSERT INTO "TelegramPublication" ("id", "productId", "destination", "updatedAt")
    VALUES ('tg_' || NEW."id", NEW."id", COALESCE(destination, ''), CURRENT_TIMESTAMP)
    ON CONFLICT ("productId") DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'TELEGRAM_OUTBOX_UNAVAILABLE: Product persisted; manual send is available';
  RETURN NEW;
END;
$$;

ALTER TABLE "LaptopAccessoryOfferDetail" ADD CONSTRAINT "AccessoryOffer_nonnegative" CHECK (
 ("healthPercent" IS NULL OR "healthPercent" BETWEEN 0 AND 100) AND
 ("cycleCount" IS NULL OR "cycleCount" >= 0) AND
 ("powerOnHours" IS NULL OR "powerOnHours" >= 0) AND
 ("warrantyDays" IS NULL OR "warrantyDays" >= 0));
