CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'POS', 'BANK_TRANSFER', 'ONLINE', 'OTHER');
CREATE TYPE "PaymentType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "PaymentCurrency" AS ENUM ('TOMAN');

ALTER TABLE "Payment"
  ALTER COLUMN "amount" TYPE DECIMAL(18, 0) USING ROUND(ABS("amount"))::DECIMAL(18, 0),
  ALTER COLUMN "method" TYPE "PaymentMethod" USING (
    CASE
      WHEN "method" IN ('نقدی', 'cash', 'CASH') THEN 'CASH'
      WHEN "method" IN ('کارت به کارت', 'card', 'CARD') THEN 'CARD'
      WHEN "method" IN ('کارتخوان', 'POS', 'pos') THEN 'POS'
      WHEN "method" IN ('حواله بانکی', 'bank_transfer', 'BANK_TRANSFER') THEN 'BANK_TRANSFER'
      WHEN "method" IN ('درگاه بانکی', 'gateway', 'online', 'ONLINE') THEN 'ONLINE'
      ELSE 'OTHER'
    END::"PaymentMethod"
  ),
  ALTER COLUMN "type" TYPE "PaymentType" USING (
    CASE
      WHEN "amount" < 0 OR "type" IN ('پرداختی', 'هزینه', 'EXPENSE', 'expense') THEN 'EXPENSE'
      ELSE 'INCOME'
    END::"PaymentType"
  ),
  ALTER COLUMN "method" SET NOT NULL,
  ALTER COLUMN "type" SET NOT NULL,
  ALTER COLUMN "type" SET DEFAULT 'INCOME';

ALTER TABLE "Payment"
  ADD COLUMN "currency" "PaymentCurrency" NOT NULL DEFAULT 'TOMAN',
  ADD COLUMN "account" TEXT,
  ADD COLUMN "counterparty" TEXT,
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "confirmedById" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Payment"
SET "paidAt" = "createdAt"
WHERE "status" = 'success';

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "Payment_order_required_for_income" CHECK ("type" <> 'INCOME' OR "orderId" IS NOT NULL),
  ADD CONSTRAINT "Payment_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Payment_orderId_createdAt_idx" ON "Payment"("orderId", "createdAt");
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");
CREATE INDEX "Payment_type_createdAt_idx" ON "Payment"("type", "createdAt");
CREATE INDEX "Payment_method_createdAt_idx" ON "Payment"("method", "createdAt");
CREATE INDEX "Payment_confirmedById_idx" ON "Payment"("confirmedById");
