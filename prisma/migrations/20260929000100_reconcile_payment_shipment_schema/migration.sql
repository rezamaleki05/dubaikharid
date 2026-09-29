ALTER TABLE "Payment"
  DROP CONSTRAINT "Payment_orderId_fkey";

ALTER TABLE "Payment"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "Shipment"
  ALTER COLUMN "dateUpdated" DROP DEFAULT;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_orderId_fkey"
  FOREIGN KEY ("orderId")
  REFERENCES "Order"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
