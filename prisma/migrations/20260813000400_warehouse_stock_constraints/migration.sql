-- Enforce inventory invariants for every future insert/update, including writes
-- that bypass the application. NOT VALID keeps this migration safe if a legacy
-- database contains rows that predate these rules.
ALTER TABLE "WarehouseItem"
  ADD CONSTRAINT "WarehouseItem_stock_nonnegative" CHECK ("stock" >= 0) NOT VALID,
  ADD CONSTRAINT "WarehouseItem_reserved_nonnegative" CHECK ("reserved" >= 0) NOT VALID,
  ADD CONSTRAINT "WarehouseItem_reserved_within_stock" CHECK ("reserved" <= "stock") NOT VALID,
  ADD CONSTRAINT "WarehouseItem_minStock_nonnegative" CHECK ("minStock" >= 0) NOT VALID,
  ADD CONSTRAINT "WarehouseItem_price_nonnegative" CHECK ("price" >= 0) NOT VALID;

ALTER TABLE "InventoryMovement"
  ADD CONSTRAINT "InventoryMovement_quantityBefore_nonnegative" CHECK ("quantityBefore" >= 0) NOT VALID,
  ADD CONSTRAINT "InventoryMovement_quantityAfter_nonnegative" CHECK ("quantityAfter" >= 0) NOT VALID,
  ADD CONSTRAINT "InventoryMovement_reservedBefore_nonnegative" CHECK ("reservedBefore" IS NULL OR "reservedBefore" >= 0) NOT VALID,
  ADD CONSTRAINT "InventoryMovement_reservedAfter_nonnegative" CHECK ("reservedAfter" IS NULL OR "reservedAfter" >= 0) NOT VALID;
