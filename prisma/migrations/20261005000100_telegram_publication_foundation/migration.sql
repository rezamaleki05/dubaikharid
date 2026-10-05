-- Additive metadata only; existing public Products never get historical posts.
ALTER TABLE "Product" ADD COLUMN "telegramFirstPublishedAt" TIMESTAMP(3);
UPDATE "Product" SET "telegramFirstPublishedAt" = "createdAt" WHERE "status" = 'active';
CREATE TYPE "TelegramPublicationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TABLE "TelegramPublication" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "status" "TelegramPublicationStatus" NOT NULL DEFAULT 'PENDING',
  "telegramMessageId" TEXT,
  "telegramChatId" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "lockedAt" TIMESTAMP(3),
  "claimToken" TEXT,
  "retryAfter" TIMESTAMP(3),
  "uncertain" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "TelegramPublication_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TelegramPublication_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Stronger than Product/channel uniqueness: changing a channel cannot auto-duplicate a Product.
CREATE UNIQUE INDEX "TelegramPublication_productId_key" ON "TelegramPublication"("productId");
CREATE INDEX "TelegramPublication_status_lockedAt_idx" ON "TelegramPublication"("status", "lockedAt");

-- Record the real first activation even when integration is disabled.
CREATE FUNCTION "telegram_mark_first_publish"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" = 'active' AND NEW."telegramFirstPublishedAt" IS NULL THEN
    NEW."telegramFirstPublishedAt" := CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "telegram_mark_first_publish" BEFORE INSERT OR UPDATE OF "status" ON "Product"
FOR EACH ROW EXECUTE FUNCTION "telegram_mark_first_publish"();

-- Transactional outbox: event commits with the Product, with no Telegram network I/O.
-- PostgreSQL exception subtransactions isolate an integration storage failure from publishing.
CREATE FUNCTION "telegram_enqueue_first_publish"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE destination TEXT;
BEGIN
  IF NEW."status" <> 'active' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD."telegramFirstPublishedAt" IS NOT NULL THEN RETURN NEW; END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Setting" WHERE "key" = 'telegramEnabled' AND "value" = 'true')
     OR NOT EXISTS (SELECT 1 FROM "Setting" WHERE "key" = 'telegramAutoPublishProducts' AND "value" = 'true') THEN
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
CREATE TRIGGER "telegram_enqueue_first_publish" AFTER INSERT OR UPDATE OF "status" ON "Product"
FOR EACH ROW EXECUTE FUNCTION "telegram_enqueue_first_publish"();
