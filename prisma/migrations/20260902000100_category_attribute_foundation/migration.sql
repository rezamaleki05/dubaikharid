-- Phase 2A is expand-only: it introduces category-configured product attributes
-- without changing existing Product, Category, Warehouse, Laptop, Cart, or Order data.
CREATE TYPE "CatalogAttributeInputType" AS ENUM (
  'SELECT',
  'MULTI_SELECT',
  'TEXT',
  'NUMBER',
  'BOOLEAN',
  'COLOR'
);

CREATE TABLE "CatalogAttribute" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "nameFa" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "inputType" "CatalogAttributeInputType" NOT NULL,
  "unitFa" TEXT,
  "unitEn" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogAttribute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AttributeOption" (
  "id" TEXT NOT NULL,
  "attributeId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "labelFa" TEXT NOT NULL,
  "labelEn" TEXT NOT NULL,
  "swatchHex" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AttributeOption_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AttributeOption_swatchHex_format" CHECK (
    "swatchHex" IS NULL OR "swatchHex" ~ '^#[0-9A-Fa-f]{6}$'
  )
);

CREATE TABLE "CategoryAttribute" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "attributeId" TEXT NOT NULL,
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  "isVariantDefining" BOOLEAN NOT NULL DEFAULT false,
  "allowsMultiple" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CategoryAttribute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductAttributeValue" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "categoryAttributeId" TEXT NOT NULL,
  "attributeId" TEXT NOT NULL,
  "attributeOptionId" TEXT,
  "textValue" TEXT,
  "numberValue" DECIMAL(18,6),
  "booleanValue" BOOLEAN,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductAttributeValue_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductAttributeValue_exactly_one_value" CHECK (
    num_nonnulls("attributeOptionId", "textValue", "numberValue", "booleanValue") = 1
  )
);

CREATE UNIQUE INDEX "CatalogAttribute_code_key" ON "CatalogAttribute"("code");
CREATE INDEX "CatalogAttribute_isActive_sortOrder_idx" ON "CatalogAttribute"("isActive", "sortOrder");

CREATE UNIQUE INDEX "AttributeOption_attributeId_code_key" ON "AttributeOption"("attributeId", "code");
CREATE UNIQUE INDEX "AttributeOption_id_attributeId_key" ON "AttributeOption"("id", "attributeId");
CREATE INDEX "AttributeOption_attributeId_isActive_sortOrder_idx" ON "AttributeOption"("attributeId", "isActive", "sortOrder");

CREATE UNIQUE INDEX "CategoryAttribute_categoryId_attributeId_key" ON "CategoryAttribute"("categoryId", "attributeId");
CREATE UNIQUE INDEX "CategoryAttribute_id_attributeId_key" ON "CategoryAttribute"("id", "attributeId");
CREATE INDEX "CategoryAttribute_categoryId_sortOrder_idx" ON "CategoryAttribute"("categoryId", "sortOrder");
CREATE INDEX "CategoryAttribute_attributeId_idx" ON "CategoryAttribute"("attributeId");

CREATE UNIQUE INDEX "ProductAttributeValue_productId_categoryAttributeId_attributeOptionId_key"
  ON "ProductAttributeValue"("productId", "categoryAttributeId", "attributeOptionId");
CREATE UNIQUE INDEX "ProductAttributeValue_one_scalar_per_assignment"
  ON "ProductAttributeValue"("productId", "categoryAttributeId")
  WHERE "attributeOptionId" IS NULL;
CREATE INDEX "ProductAttributeValue_productId_idx" ON "ProductAttributeValue"("productId");
CREATE INDEX "ProductAttributeValue_attributeId_idx" ON "ProductAttributeValue"("attributeId");
CREATE INDEX "ProductAttributeValue_attributeOptionId_idx" ON "ProductAttributeValue"("attributeOptionId");
CREATE INDEX "ProductAttributeValue_categoryAttributeId_idx" ON "ProductAttributeValue"("categoryAttributeId");

ALTER TABLE "AttributeOption"
  ADD CONSTRAINT "AttributeOption_attributeId_fkey"
  FOREIGN KEY ("attributeId") REFERENCES "CatalogAttribute"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CategoryAttribute"
  ADD CONSTRAINT "CategoryAttribute_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CategoryAttribute"
  ADD CONSTRAINT "CategoryAttribute_attributeId_fkey"
  FOREIGN KEY ("attributeId") REFERENCES "CatalogAttribute"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductAttributeValue"
  ADD CONSTRAINT "ProductAttributeValue_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductAttributeValue"
  ADD CONSTRAINT "ProductAttributeValue_categoryAttributeId_attributeId_fkey"
  FOREIGN KEY ("categoryAttributeId", "attributeId")
  REFERENCES "CategoryAttribute"("id", "attributeId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductAttributeValue"
  ADD CONSTRAINT "ProductAttributeValue_attributeOptionId_attributeId_fkey"
  FOREIGN KEY ("attributeOptionId", "attributeId")
  REFERENCES "AttributeOption"("id", "attributeId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
