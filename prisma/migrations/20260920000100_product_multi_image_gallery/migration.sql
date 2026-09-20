CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "blobPathname" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "altFa" TEXT,
    "altEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductImage_productId_sortOrder_idx"
    ON "ProductImage"("productId", "sortOrder");

CREATE INDEX "ProductImage_productId_isPrimary_idx"
    ON "ProductImage"("productId", "isPrimary");

CREATE INDEX "ProductImage_blobPathname_idx"
    ON "ProductImage"("blobPathname");

CREATE UNIQUE INDEX "ProductImage_one_primary_per_product"
    ON "ProductImage"("productId")
    WHERE "isPrimary" = true;

ALTER TABLE "ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
