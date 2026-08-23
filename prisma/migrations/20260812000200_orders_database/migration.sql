-- Extend the existing canonical order workflow without rewriting existing values.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'warehouse_dubai';

-- Keep customer notes separate from private administrator notes.
ALTER TABLE "Order" ADD COLUMN "adminNotes" TEXT;

-- Support the admin list's newest-first, status, and customer queries.
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
