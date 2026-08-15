-- Preserve the original display phone while adding a canonical identity for safe matching.
ALTER TABLE "Customer" ADD COLUMN "normalizedPhone" TEXT;

WITH normalized AS (
  SELECT
    id,
    regexp_replace(
      translate(phone, '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789'),
      '[^0-9+]', '', 'g'
    ) AS compact
  FROM "Customer"
)
UPDATE "Customer" AS customer
SET "normalizedPhone" = CASE
  WHEN normalized.compact ~ '^09[0-9]{9}$' THEN '+98' || substring(normalized.compact FROM 2)
  WHEN normalized.compact ~ '^05[0-9]{8}$' THEN '+971' || substring(normalized.compact FROM 2)
  WHEN normalized.compact ~ '^0098[0-9]+$' THEN '+' || substring(normalized.compact FROM 3)
  WHEN normalized.compact ~ '^00971[0-9]+$' THEN '+' || substring(normalized.compact FROM 3)
  WHEN normalized.compact ~ '^98[0-9]{10}$' THEN '+' || normalized.compact
  WHEN normalized.compact ~ '^971[0-9]{9}$' THEN '+' || normalized.compact
  WHEN normalized.compact ~ '^\+[1-9][0-9]{7,14}$' THEN normalized.compact
  ELSE NULL
END
FROM normalized
WHERE customer.id = normalized.id;

CREATE UNIQUE INDEX "Customer_normalizedPhone_key" ON "Customer"("normalizedPhone");
CREATE INDEX "Customer_status_createdAt_idx" ON "Customer"("status", "createdAt");
CREATE INDEX "Customer_email_idx" ON "Customer"("email");
