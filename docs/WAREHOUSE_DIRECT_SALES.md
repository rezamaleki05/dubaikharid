# Warehouse direct sales architecture

`Product`, `WarehouseItem`, and `Laptop` are separate storefront sources:

- `Product` is an external UAE-store catalog item and uses AED pricing.
- `WarehouseItem` is physically owned stock and uses its stored Toman price.
- `Laptop` remains an independently tracked physical unit.

New public orders validate that every `OrderItem` has exactly one of `productId`,
`warehouseItemId`, or `laptopId`. A checkout may contain only one source type.
Warehouse reservations use a serializable transaction and a compare-and-swap update;
cancellation releases reservations, while shipment fulfillment decrements both physical
and reserved quantities through `InventoryMovement` records.

## Future Telegram publication outbox

Telegram delivery is intentionally not implemented in this phase. Stable future domain
events should be emitted only on these transitions:

- `PRODUCT_PUBLISHED`: Product moves from a non-public status to the public status.
- `WAREHOUSE_ITEM_PUBLISHED`: `isPublished` moves from false to true.
- `LAPTOP_AVAILABLE`: a new Laptop is created as `AVAILABLE`, or a non-available unit
  explicitly returns to `AVAILABLE`.

The delivery implementation should add a transactional outbox table with a unique
`eventKey` such as `<eventType>:<entityId>:<publicationVersion>`, plus `payload`,
`attemptCount`, `nextAttemptAt`, `sentAt`, and `telegramMessageId`. Website publication
must commit independently of Telegram HTTP delivery. A retrying worker should claim
pending rows, and a unique event key must prevent duplicate posts. Ordinary price or
stock edits must not create a new publication version; reposting should require an
explicit admin action.
