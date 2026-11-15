# Data model

Migration: `20261113000100_laptop_accessories` (migration 31, applied to Preview and Production; zero drift, 0 failed).

- `LaptopAccessoryProfile`: Product primary/foreign key, category route key, part/model numbers, technical summary, compatibility notes, optional SEO and featured flag.
- `LaptopAccessoryCompatibility`: composite Product/LaptopModel key, reverse model index, real foreign keys. Duplicate compatibility is rejected.
- `LaptopAccessoryOfferDetail`: ProductVariant primary/foreign key; originality/condition enums; nullable grade, health, cycles, hours, SMART, test, warranty and manufacture facts. Numeric CHECK constraint rejects negative/impossible health. Unknown remains null.
- `ProductVariantImage`: independent ordered/primary/alt gallery, ProductVariant foreign key with Restrict deletion. Shared ProductImage/color association remains untouched.

No existing tables/columns are dropped or renamed. Existing Product, ProductVariant, ProductInventory, reservations/movements, OrderItem source and Laptop architecture remain. Physical Laptops are not Products. Existing variants are deactivated rather than deleted, preserving order references.

Auth/condition CatalogAttribute options define stable variant signatures. Technical fields use category assignments and ProductAttributeValue. Config script defaults to dry-run, uses deterministic category IDs and exact codes, and aborts on conflicting equivalent category identity instead of creating duplicates. Repeated apply reads existing system configuration before creating missing rows, preserves existing setting values, and creates no Product or stock. Two real Preview catalog replays preserved all five configuration-table fingerprints. Production setup preserved every existing configuration row and created only missing system rows.

Writes run through the existing serializable inventory retry service. Stock adjustments retain movements, admin identity and reserved-stock checks. New variants initialize the existing inventory once. Price overrides are Toman only; no AED conversion.

OrderItem retains PRODUCT_VARIANT and option snapshots, with recorded used-offer health/testing/warranty appended to the existing readable option snapshot. Public order pricing remains server-authoritative. Client-supplied price is not accepted by checkout.

The existing PostgreSQL Product Telegram outbox function is conditionally extended. Accessories are first inserted hidden, profile/offers created in the transaction, then published. Thus the first-publish trigger can choose the separate accessory flag. Ordinary Products keep the old flag and behavior. No network request occurs inside the transaction.
