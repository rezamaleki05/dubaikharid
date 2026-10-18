BEGIN;
ALTER TABLE "Laptop" ADD COLUMN "isTouchscreen" BOOLEAN,
 ADD COLUMN "displayResolution" TEXT, ADD COLUMN "telegramFirstPublishedAt" TIMESTAMP(3);
CREATE TABLE "LaptopTelegramPublication" (
 "id" TEXT NOT NULL, "laptopId" TEXT NOT NULL, "destination" TEXT NOT NULL,
 "status" "TelegramPublicationStatus" NOT NULL DEFAULT 'PENDING',
 "telegramMessageId" TEXT, "telegramChatId" TEXT, "attemptCount" INTEGER NOT NULL DEFAULT 0,
 "lastError" TEXT, "lockedAt" TIMESTAMP(3), "claimToken" TEXT, "retryAfter" TIMESTAMP(3),
 "uncertain" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL, "sentAt" TIMESTAMP(3),
 CONSTRAINT "LaptopTelegramPublication_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "LaptopTelegramPublication_laptopId_fkey" FOREIGN KEY ("laptopId") REFERENCES "Laptop"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LaptopTelegramPublication_laptopId_key" ON "LaptopTelegramPublication"("laptopId");
CREATE INDEX "LaptopTelegramPublication_status_lockedAt_idx" ON "LaptopTelegramPublication"("status", "lockedAt");
-- Never backfill a publication/sent marker for historical units. Only units created
-- after this migration completes can produce an automatic first-publication intent.
CREATE FUNCTION "laptop_telegram_mark_first_publish"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."status" = 'AVAILABLE' AND NEW."archivedAt" IS NULL AND NEW."reservedOrderId" IS NULL
 AND NEW."priceToman" > 0 AND trim(COALESCE(NEW."brand", '')) <> '' AND trim(COALESCE(NEW."model", '')) <> ''
 AND NEW."telegramFirstPublishedAt" IS NULL AND NEW."createdAt" > (
 SELECT "finished_at" FROM "_prisma_migrations" WHERE "migration_name" = '20261018000100_laptop_stock_complete' AND "rolled_back_at" IS NULL LIMIT 1
 ) THEN NEW."telegramFirstPublishedAt" := CURRENT_TIMESTAMP; END IF;
 RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END; $$;
CREATE TRIGGER "laptop_telegram_mark_first_publish" BEFORE INSERT OR UPDATE ON "Laptop"
FOR EACH ROW EXECUTE FUNCTION "laptop_telegram_mark_first_publish"();
CREATE FUNCTION "laptop_telegram_enqueue_first_publish"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE destination TEXT;
BEGIN
 IF NEW."telegramFirstPublishedAt" IS NULL THEN RETURN NEW; END IF;
 IF TG_OP = 'UPDATE' THEN IF OLD."telegramFirstPublishedAt" IS NOT NULL THEN RETURN NEW; END IF; END IF;
 IF NOT EXISTS (SELECT 1 FROM "Setting" WHERE "key"='telegramEnabled' AND "value"='true')
 OR NOT EXISTS (SELECT 1 FROM "Setting" WHERE "key"='telegramAutoPublishLaptops' AND "value"='true') THEN RETURN NEW; END IF;
 SELECT trim("value") INTO destination FROM "Setting" WHERE "key"='telegramChannel';
 INSERT INTO "LaptopTelegramPublication" ("id", "laptopId", "destination", "updatedAt")
 VALUES ('ltg_' || NEW."id", NEW."id", COALESCE(destination, ''), CURRENT_TIMESTAMP)
 ON CONFLICT ("laptopId") DO NOTHING;
 RETURN NEW;
EXCEPTION WHEN OTHERS THEN
 RAISE WARNING 'LAPTOP_TELEGRAM_OUTBOX_UNAVAILABLE'; RETURN NEW;
END; $$;
CREATE TRIGGER "laptop_telegram_enqueue_first_publish" AFTER INSERT OR UPDATE ON "Laptop"
FOR EACH ROW EXECUTE FUNCTION "laptop_telegram_enqueue_first_publish"();
COMMIT;
