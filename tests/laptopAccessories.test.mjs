import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  validateAccessory,
  accessoryImages,
  chooseAccessoryOffer,
  accessoryAvailable,
  accessoryGallery,
  ACCESSORY_AUTHENTICITY,
} from "../src/lib/laptopAccessoryDomain.js";
import { publicProductHref } from "../src/lib/productUrl.js";
import { configureAccessoryCatalog } from "../src/lib/laptopAccessoryCatalogConfig.js";
import { canonicalIndexNowUrl } from "../src/lib/indexnowDomain.js";
import {
  hasPermission,
  ADMIN_PERMISSIONS,
} from "../src/lib/adminPermissions.js";
import { resolveProductVariantPriceFromData } from "../src/lib/productSupplyPricingDomain.js";
import { buildProductVariantOrderItemSnapshotFromData } from "../src/lib/productVariantOrderItemDomain.js";
const base = () => ({
  nameFa: "باتری نمونه محیط تست",
  nameEn: "Preview battery fixture",
  slug: "preview-battery",
  brandId: "dell",
  categorySlug: "battery",
  compatibility: ["model-1"],
  published: true,
  offers: [
    {
      authenticity: "ORIGINAL",
      condition: "USED",
      isActive: true,
      price: "1200000",
      stock: 3,
      healthPercent: 86,
      cycleCount: 143,
    },
  ],
});
for (const authenticity of Object.keys(ACCESSORY_AUTHENTICITY))
  for (const condition of ["NEW", "USED"])
    test(`${authenticity}/${condition} validates with transparent identity`, () => {
      const p = base();
      Object.assign(p.offers[0], { authenticity, condition });
      const d = validateAccessory(p);
      assert.equal(d.offers[0].detail.authenticity, authenticity);
      assert.equal(
        d.offers[0].detail.healthPercent,
        condition === "USED" ? 86 : null,
      );
    });
for (const [name, change] of [
  ["duplicate offers", (p) => p.offers.push({ ...p.offers[0] })],
  ["duplicate compatibility", (p) => p.compatibility.push("model-1")],
  ["negative stock", (p) => (p.offers[0].stock = -1)],
  ["fractional stock", (p) => (p.offers[0].stock = 1.2)],
  ["health >100", (p) => (p.offers[0].healthPercent = 101)],
  ["cycle negative", (p) => (p.offers[0].cycleCount = -1)],
  ["warranty negative", (p) => (p.offers[0].warrantyDays = -1)],
  ["zero active price", (p) => (p.offers[0].price = 0)],
  ["invalid category", (p) => (p.categorySlug = "invalid")],
  ["invalid slug", (p) => (p.slug = "../admin")],
  ["invalid authenticity", (p) => (p.offers[0].authenticity = "fake")],
  ["invalid condition", (p) => (p.offers[0].condition = "open")],
  ["invalid SKU", (p) => (p.offers[0].sku = "<script>")],
  ["invalid spec", (p) => (p.specs = { cpu: "invented" })],
])
  test(`rejects ${name}`, () => {
    const p = base();
    change(p);
    assert.throws(() => validateAccessory(p));
  });
test("unknown health remains unknown and category-irrelevant facts are not inferred", () => {
  const p = base();
  delete p.offers[0].healthPercent;
  assert.equal(validateAccessory(p).offers[0].detail.healthPercent, null);
  p.categorySlug = "ram";
  assert.equal(validateAccessory(p).offers[0].detail.cycleCount, null);
});
test("empty inactive matrix slots can coexist with real active stock", () => {
  const p = base();
  p.offers.push({
    authenticity: "COMPATIBLE",
    condition: "NEW",
    isActive: false,
    price: "",
    stock: 0,
  });
  assert.equal(validateAccessory(p).offers[1].priceTomanOverride, null);
});
test("strict image ownership rejects arbitrary protocols hosts query paths and duplicate covers", () => {
  for (const url of [
    "javascript:alert(1)",
    "https://evil.test/image.png",
    "https://store.public.blob.vercel-storage.com/products/thing.jpg",
  ])
    assert.throws(() => accessoryImages([{ url }]));
  const image = {
    url: "https://store.public.blob.vercel-storage.com/laptop-accessories/2026/12345678-1234-1234-1234-123456789abc.jpg",
  };
  assert.equal(accessoryImages([image])[0].isPrimary, true);
  assert.throws(() => accessoryImages([image, image]));
});
test("selection never swaps to inactive default and prefers available default", () => {
  const a = {
      id: "a",
      isDefault: true,
      isActive: false,
      inventory: { stock: 5, reserved: 0 },
    },
    b = { id: "b", isActive: true, inventory: { stock: 1, reserved: 1 } },
    c = { id: "c", isActive: true, inventory: { stock: 2, reserved: 0 } };
  assert.equal(chooseAccessoryOffer([a, b, c]).id, "c");
  assert.equal(chooseAccessoryOffer([a, b]).id, "b");
  assert.equal(accessoryAvailable(a), 0);
  assert.equal(accessoryAvailable(b), 0);
  assert.equal(chooseAccessoryOffer([a]), null);
});
test("offer gallery falls back to shared gallery without touching color galleries", () => {
  const p = { images: [{ url: "shared" }] };
  assert.equal(accessoryGallery(p, {}), p.images);
  const offer = { accessoryImages: [{ url: "used" }] };
  assert.equal(accessoryGallery(p, offer), offer.accessoryImages);
});
test("canonical resolver and IndexNow keep one accessory route", () => {
  const p = {
    id: "a",
    slug: "dell-battery",
    accessoryProfile: { categorySlug: "battery" },
  };
  assert.equal(
    publicProductHref(p),
    "/laptop-accessories/battery/dell-battery",
  );
  assert.equal(publicProductHref({ id: "normal" }), "/product/normal");
  assert.equal(
    canonicalIndexNowUrl("https://dubaikharid.shop" + publicProductHref(p)),
    "https://dubaikharid.shop/laptop-accessories/battery/dell-battery",
  );
  assert.equal(
    canonicalIndexNowUrl(
      "https://dubaikharid.shop/laptop-accessories/battery/dell-battery?condition=used",
    ),
    null,
  );
});
test("dedicated access conservatively excludes CONTENT/OPERATIONS/FINANCE", () => {
  for (const role of ["SUPER_ADMIN", "ADMIN"])
    assert.equal(
      hasPermission({ role }, ADMIN_PERMISSIONS.LAPTOP_ACCESSORIES_EDIT),
      true,
    );
  for (const role of ["CONTENT", "OPERATIONS", "FINANCE"])
    assert.equal(
      hasPermission({ role }, ADMIN_PERMISSIONS.LAPTOP_ACCESSORIES_EDIT),
      false,
    );
});
test("system config dry run cannot mutate and has unique categories/attributes", async () => {
  const plan = await configureAccessoryCatalog(
    new Proxy(
      {},
      {
        get() {
          throw Error("Database call in dry-run");
        },
      },
    ),
  );
  assert.equal(plan.dryRun, true);
  assert.equal(new Set(plan.attributes).size, plan.attributes.length);
  assert.equal(plan.categories.length, 8);
});
test("IRAN_STOCK resolves variant Toman without AED settings and order keeps health snapshot", () => {
  const product = {
    id: "p",
    nameFa: "باتری",
    nameEn: "Battery",
    supplyMode: "IRAN_STOCK",
    weight: 1,
    priceAed: 1000,
    priceToman: null,
  };
  const variant = {
    id: "v",
    productId: "p",
    isActive: true,
    priceTomanOverride: "1200000",
    optionSignature: "accessory_authenticity=ORIGINAL|accessory_condition=USED",
    options: [],
    accessoryOffer: { healthPercent: 86, cycleCount: 143 },
  };
  const pricing = resolveProductVariantPriceFromData({ product, variant });
  assert.equal(pricing.finalPriceToman, "1200000");
  const snapshot = buildProductVariantOrderItemSnapshotFromData({
    product,
    variant,
    pricing,
    quantity: 1,
  });
  assert.equal(snapshot.sourceKind, "PRODUCT_VARIANT");
  assert.equal(
    snapshot.selectedOptionsSnapshot.find(
      (x) => x.attributeCode === "accessory_healthPercent",
    ).labelFa,
    "86",
  );
});
test("migration only adds structures and replaces the existing conditional outbox function", () => {
  const sql = fs.readFileSync(
    "prisma/migrations/20261113000100_laptop_accessories/migration.sql",
    "utf8",
  );
  assert.doesNotMatch(sql, /\b(DROP|TRUNCATE|DELETE FROM|RENAME)\b/i);
  for (const name of [
    "LaptopAccessoryProfile",
    "LaptopAccessoryCompatibility",
    "LaptopAccessoryOfferDetail",
    "ProductVariantImage",
  ])
    assert.match(sql, new RegExp(`CREATE TABLE "${name}"`));
  assert.match(sql, /telegramAutoPublishLaptopAccessories/);
  assert.match(sql, /ELSE 'telegramAutoPublishProducts'/);
});
test("uploaded image verification checks size MIME and content magic before attachment", async () => {
  const { verifyAccessoryBlob } = await import(
    "../src/lib/laptopAccessoryUploadDomain.js"
  );
  const head = new Response(null, {
    headers: { "content-type": "image/png", "content-length": "8" },
  });
  const png = new Response(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]));
  await verifyAccessoryBlob(
    { url: "https://store.public.blob.vercel-storage.com/file" },
    async (_, o) => (o.method === "HEAD" ? head : png),
  );
  await assert.rejects(() =>
    verifyAccessoryBlob(
      { url: "https://store.public.blob.vercel-storage.com/file" },
      async () =>
        new Response(null, {
          headers: {
            "content-type": "image/png",
            "content-length": String(11 * 1024 * 1024),
          },
        }),
    ),
  );
});
