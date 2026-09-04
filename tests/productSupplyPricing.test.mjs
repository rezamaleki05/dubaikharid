import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { calculateProductPricing } from '../src/lib/pricing.js';
import {
  getEffectiveDiscountPercent,
  resolveProductVariantPriceFromData,
  validateProductSupplyPricingPayload,
} from '../src/lib/productSupplyPricingDomain.js';
import {
  validateCreateProductVariantPayload,
  validateUpdateProductVariantPayload,
} from '../src/lib/productVariantDomain.js';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
const schema = read('prisma/schema.prisma');
const migration = read('prisma/migrations/20260902000300_product_supply_pricing/migration.sql');
const service = read('src/lib/productSupplyPricingService.js');
const pricingRoute = read('src/app/api/admin/products/[id]/pricing/route.js');
const variantRoute = read('src/app/api/admin/product-variants/[id]/route.js');
const cartRoute = read('src/app/api/cart/resolve/route.js');
const publicOrders = read('src/lib/publicOrders.js');
const warehouseSales = read('src/lib/warehouseSales.js');
const adminLaptops = read('src/lib/adminLaptops.js');

const settings = {
  aedRate: '20000',
  commissionPercent: '10',
  shippingPerKgAed: '40',
  minWeightClass: '0.5',
  roundingMethod: 'ceil',
};

const externalProduct = {
  id: 'product-1',
  supplyMode: 'EXTERNAL_DUBAI',
  priceAed: '120.00',
  priceToman: null,
  weight: 1.2,
  hasDiscount: false,
  discountPercent: 0,
};

const defaultVariant = {
  id: 'variant-default',
  productId: 'product-1',
  priceAedOverride: null,
  priceTomanOverride: null,
  discountPercentOverride: null,
  weightOverride: null,
};

test('schema uses one explicit supply enum and safe nullable financial columns', () => {
  assert.match(schema, /enum ProductSupplyMode \{\s*EXTERNAL_DUBAI\s*IRAN_STOCK\s*\}/s);
  assert.match(schema, /priceAed\s+Decimal\?\s+@db\.Decimal\(12, 2\)/);
  assert.match(schema, /priceToman\s+Decimal\?\s+@db\.Decimal\(18, 0\)/);
  assert.match(schema, /supplyMode\s+ProductSupplyMode\s+@default\(EXTERNAL_DUBAI\)/);
  for (const field of ['priceAedOverride', 'priceTomanOverride', 'discountPercentOverride', 'weightOverride']) {
    assert.match(schema, new RegExp(`${field}\\s+`));
  }
  assert.doesNotMatch(schema, /isIran|hasIranStock|isDirect/);
});

test('single migration is expand-compatible and leaves unrelated business tables untouched', () => {
  assert.match(migration, /DEFAULT 'EXTERNAL_DUBAI'/);
  assert.match(migration, /ALTER COLUMN "priceAed" DROP NOT NULL/);
  assert.match(migration, /discountPercentOverride_range/);
  assert.doesNotMatch(migration, /^\s*(?:DROP TABLE|DROP COLUMN|DELETE|TRUNCATE|UPDATE)\b/im);
  assert.doesNotMatch(migration, /"(?:Warehouse|Laptop|Cart|Order|OrderItem|Payment|Shipment)/);
});

test('external default pricing exactly matches the legacy calculator', () => {
  const legacy = calculateProductPricing({ priceAed: 120, weight: 1.2 }, settings);
  const resolved = resolveProductVariantPriceFromData({ product: externalProduct, variant: defaultVariant, settings });
  assert.equal(resolved.supplyMode, 'EXTERNAL_DUBAI');
  assert.equal(resolved.currencySource, 'AED');
  assert.equal(resolved.discountPercent, 0);
  assert.equal(resolved.commissionAmount, String(legacy.commissionAed));
  assert.equal(resolved.shippingAmount, String(legacy.shippingAed));
  assert.equal(resolved.finalPriceToman, String(legacy.totalToman));
});

test('external product discount is applied once before commission, shipping and FX', () => {
  const product = { ...externalProduct, hasDiscount: true, discountPercent: 20 };
  const resolved = resolveProductVariantPriceFromData({ product, variant: defaultVariant, settings });
  const legacy = calculateProductPricing({ priceAed: 96, weight: 1.2 }, settings);
  assert.equal(resolved.discountedBasePrice, '96');
  assert.equal(resolved.commissionAmount, String(legacy.commissionAed));
  assert.equal(resolved.shippingAmount, '80');
  assert.equal(resolved.exchangeRate, '20000');
  assert.equal(resolved.finalPriceToman, String(legacy.totalToman));
});

test('external variant AED and weight overrides are authoritative', () => {
  const variant = { ...defaultVariant, priceAedOverride: '150.00', weightOverride: 0.2 };
  const resolved = resolveProductVariantPriceFromData({ product: externalProduct, variant, settings });
  assert.equal(resolved.basePrice, '150.00');
  assert.equal(resolved.weight, 1);
  assert.equal(resolved.shippingAmount, '40');
  assert.equal(resolved.finalPriceToman, '4100000');
});

test('missing external AED price is rejected and no fake zero is accepted', () => {
  assert.throws(
    () => resolveProductVariantPriceFromData({
      product: { ...externalProduct, priceAed: null },
      variant: defaultVariant,
      settings,
    }),
    error => error.code === 'AED_PRICE_REQUIRED',
  );
  assert.ok(validateProductSupplyPricingPayload({ priceAed: 0 }).error);
});

test('Iran Product Toman price applies inherited discount with no external charges', () => {
  const product = {
    ...externalProduct,
    supplyMode: 'IRAN_STOCK',
    priceAed: null,
    priceToman: '2000000',
    hasDiscount: true,
    discountPercent: 20,
  };
  const resolved = resolveProductVariantPriceFromData({ product, variant: defaultVariant });
  assert.equal(resolved.currencySource, 'TOMAN');
  assert.equal(resolved.finalPriceToman, '1600000');
  assert.equal(resolved.commissionAmount, null);
  assert.equal(resolved.shippingAmount, null);
  assert.equal(resolved.exchangeRate, null);
});

test('Iran variant Toman override inherits Product discount', () => {
  const product = {
    ...externalProduct,
    supplyMode: 'IRAN_STOCK',
    priceAed: null,
    priceToman: '2000000',
    hasDiscount: true,
    discountPercent: 20,
  };
  const variant = { ...defaultVariant, priceTomanOverride: '2200000' };
  const resolved = resolveProductVariantPriceFromData({ product, variant });
  assert.equal(resolved.basePrice, '2200000');
  assert.equal(resolved.discountPercent, 20);
  assert.equal(resolved.finalPriceToman, '1760000');
});

test('explicit zero Variant discount disables Product discount', () => {
  const product = {
    ...externalProduct,
    supplyMode: 'IRAN_STOCK',
    priceToman: '2000000',
    hasDiscount: true,
    discountPercent: 20,
  };
  const variant = { ...defaultVariant, priceTomanOverride: '2200000', discountPercentOverride: 0 };
  const resolved = resolveProductVariantPriceFromData({ product, variant });
  assert.equal(resolved.discountPercent, 0);
  assert.equal(resolved.finalPriceToman, '2200000');
});

test('null discount override inherits and hasDiscount false normalizes Product discount to zero', () => {
  assert.equal(getEffectiveDiscountPercent({ hasDiscount: false, discountPercent: 99 }, defaultVariant), 0);
  assert.equal(getEffectiveDiscountPercent({ hasDiscount: true, discountPercent: 17 }, defaultVariant), 17);
});

test('discount validation rejects negative and greater-than-100 values', () => {
  assert.ok(validateUpdateProductVariantPayload({ discountPercentOverride: -1 }).error);
  assert.ok(validateUpdateProductVariantPayload({ discountPercentOverride: 101 }).error);
  assert.throws(
    () => getEffectiveDiscountPercent(
      { hasDiscount: true, discountPercent: 20 },
      { discountPercentOverride: -1 },
    ),
    error => error.code === 'INVALID_DISCOUNT',
  );
});

test('nullable Variant overrides preserve null inheritance semantics', () => {
  const result = validateCreateProductVariantPayload({
    optionIds: [],
    priceAedOverride: '',
    priceTomanOverride: null,
    discountPercentOverride: null,
    weightOverride: '',
  });
  assert.deepEqual(result.data, {
    optionIds: [],
    sku: null,
    priceAedOverride: null,
    priceTomanOverride: null,
    discountPercentOverride: null,
    weightOverride: null,
  });
});

test('Iran pricing rejects missing direct Toman instead of falling back to AED', () => {
  assert.throws(
    () => resolveProductVariantPriceFromData({
      product: { ...externalProduct, supplyMode: 'IRAN_STOCK', priceToman: null },
      variant: defaultVariant,
    }),
    error => error.code === 'TOMAN_PRICE_REQUIRED',
  );
});

test('whole-Toman half-up rounding is deterministic without Number precision loss', () => {
  const small = resolveProductVariantPriceFromData({
    product: { ...externalProduct, supplyMode: 'IRAN_STOCK', priceToman: '1', hasDiscount: true, discountPercent: 50 },
    variant: defaultVariant,
  });
  assert.equal(small.finalPriceToman, '1');
  const large = resolveProductVariantPriceFromData({
    product: { ...externalProduct, supplyMode: 'IRAN_STOCK', priceToman: '999999999999999999', hasDiscount: true, discountPercent: 1 },
    variant: defaultVariant,
  });
  assert.equal(large.finalPriceToman, '989999999999999999');
});

test('protected Admin foundation exposes mode update, Variant overrides and authoritative preview', () => {
  assert.match(pricingRoute, /PRODUCTS_VIEW/);
  assert.match(pricingRoute, /PRODUCTS_EDIT/);
  assert.match(pricingRoute, /resolveAuthoritativeProductVariantPrice/);
  assert.match(pricingRoute, /updateProductSupplyPricing/);
  assert.match(variantRoute, /validateUpdateProductVariantPayload/);
  assert.match(service, /assertProductPricingState/);
  assert.match(service, /TOMAN_PRICE_REQUIRED/);
  assert.match(service, /AED_PRICE_REQUIRED/);
});

test('IRAN_STOCK requires an authoritative Variant and inventory-aware transaction', () => {
  assert.match(cartRoute, /resolvePublicProductCartLines/);
  assert.match(publicOrders, /createFutureIranStockVariantOrder/);
  assert.match(publicOrders, /resolvedProductLines\[0\]\.supplyMode === 'IRAN_STOCK'/);
  assert.match(publicOrders, /INVENTORY_NOT_INITIALIZED/);
});

test('Warehouse and Laptop pricing remain independent of Product resolver', () => {
  assert.doesNotMatch(warehouseSales, /productSupplyPricing|ProductSupplyMode|IRAN_STOCK/);
  assert.doesNotMatch(adminLaptops, /productSupplyPricing|ProductSupplyMode|IRAN_STOCK/);
  assert.doesNotMatch(migration, /Warehouse|Laptop/);
});
