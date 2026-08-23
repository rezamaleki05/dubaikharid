ALTER TABLE "Customer"
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "defaultAddress" TEXT,
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "CustomerOAuthAccount" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerOAuthAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerOAuthAccount_provider_providerAccountId_key"
ON "CustomerOAuthAccount"("provider", "providerAccountId");

CREATE INDEX "CustomerOAuthAccount_customerId_idx"
ON "CustomerOAuthAccount"("customerId");

ALTER TABLE "CustomerOAuthAccount"
ADD CONSTRAINT "CustomerOAuthAccount_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
