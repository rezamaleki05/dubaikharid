-- Add private receipt metadata to the existing Payment records.
ALTER TABLE "Payment"
  ADD COLUMN "receiptBlobPathname" TEXT,
  ADD COLUMN "receiptOriginalName" TEXT,
  ADD COLUMN "receiptMimeType" TEXT,
  ADD COLUMN "receiptSizeBytes" INTEGER,
  ADD COLUMN "receiptSubmittedAt" TIMESTAMP(3),
  ADD COLUMN "rejectionReason" TEXT;

-- Store Admin-managed destinations for manual/card-to-card payments.
CREATE TABLE "BankAccount" (
  "id" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "cardNumber" TEXT NOT NULL,
  "iban" TEXT NOT NULL,
  "accountHolderName" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BankAccount_cardNumber_key" ON "BankAccount"("cardNumber");
CREATE UNIQUE INDEX "BankAccount_iban_key" ON "BankAccount"("iban");
CREATE INDEX "BankAccount_isActive_isDefault_idx" ON "BankAccount"("isActive", "isDefault");

-- PostgreSQL partial uniqueness guarantees at most one default account.
CREATE UNIQUE INDEX "BankAccount_single_default_idx"
  ON "BankAccount" ("isDefault")
  WHERE "isDefault" = true;
