import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildProductVariantSignature,
  DEFAULT_PRODUCT_VARIANT_SIGNATURE,
  MAX_PRODUCT_VARIANT_COMBINATIONS,
  normalizeProductVariantSku,
  validateCreateProductVariantPayload,
  validatePreviewProductVariantPayload,
  validateReplaceProductVariantOptionsPayload,
  validateUpdateProductVariantPayload,
  variantCapacityResult,
} from '../src/lib/productVariantDomain.js';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
const schema = read('prisma/schema.prisma');
const migration = read('prisma/migrations/20260902000200_product_variant_foundation/migration.sql');
const service = read('src/lib/adminProductVariantService.js');
const attributeService = read('src/lib/adminCatalogAttributeService.js');
const productCreateRoute = read('src/app/api/admin/products/route.js');
const productRoute = read('src/app/api/admin/products/[id]/route.js');
const publicCatalog = read('src/lib/publicCatalog.js');
const variantRoutes = [
  'src/app/api/admin/products/[id]/variants/route.js',
  'src/app/api/admin/products/[id]/variants/preview/route.js',
  'src/app/api/admin/product-variants/[id]/route.js',
  'src/app/api/admin/product-variants/[id]/options/route.js',
].map(read).join('\n');

const selections = [
  { attributeCode: 'color', optionCode: 'black' },
  { attributeCode: 'eu_size', optionCode: '42' },
];

test('zero selections have the hidden default signature', () => {
  assert.equal(buildProductVariantSignature([]), DEFAULT_PRODUCT_VARIANT_SIGNATURE);
  assert.equal(DEFAULT_PRODUCT_VARIANT_SIGNATURE, '__default__');
});

test('signature is canonical regardless of request option order', () => {
  const forward = buildProductVariantSignature(selections);
  const reverse = buildProductVariantSignature([...selections].reverse());
  assert.equal(forward, 'color=black|eu_size=42');
  assert.equal(reverse, forward);
});

test('signature identity excludes localized labels', () => {
  assert.equal(
    buildProductVariantSignature(selections.map(item => ({ ...item, labelFa: 'برچسب', labelEn: 'Label' }))),
    buildProductVariantSignature(selections),
  );
});

test('different option combinations produce different signatures', () => {
  assert.notEqual(
    buildProductVariantSignature(selections),
    buildProductVariantSignature([{ ...selections[0], optionCode: 'white' }, selections[1]]),
  );
});

test('SKU is optional, normalized, and validated', () => {
  assert.deepEqual(normalizeProductVariantSku(''), { value: null });
  assert.deepEqual(normalizeProductVariantSku('  shoe-black-42 '), { value: 'SHOE-BLACK-42' });
  assert.ok(normalizeProductVariantSku('bad sku').error);
});

test('create payload requires strict server-owned option IDs and excludes signatures', () => {
  assert.deepEqual(validateCreateProductVariantPayload({ optionIds: [], sku: null }).data, {
    optionIds: [],
    sku: null,
  });
  assert.ok(validateCreateProductVariantPayload({ optionIds: ['black'], optionSignature: 'client-value' }).error);
  assert.ok(validateCreateProductVariantPayload({ optionIds: ['black', 'black'] }).error);
});

test('metadata update cannot silently mutate the option combination', () => {
  assert.deepEqual(validateUpdateProductVariantPayload({ isActive: false, sortOrder: 8 }).data, {
    isActive: false,
    sortOrder: 8,
  });
  assert.ok(validateUpdateProductVariantPayload({ optionIds: ['black'] }).error);
  assert.ok(validateUpdateProductVariantPayload({ optionSignature: 'forged' }).error);
});

test('replace-options operation requires at least one option and rejects duplicates', () => {
  assert.ok(validateReplaceProductVariantOptionsPayload({ optionIds: [] }).error);
  assert.ok(validateReplaceProductVariantOptionsPayload({ optionIds: ['black', 'black'] }).error);
  assert.deepEqual(validateReplaceProductVariantOptionsPayload({ optionIds: ['black', '42'] }).data.optionIds, ['black', '42']);
});

test('preview enforces the hard request cap', () => {
  assert.equal(MAX_PRODUCT_VARIANT_COMBINATIONS, 200);
  assert.ok(validatePreviewProductVariantPayload({ combinations: [] }).error);
  assert.ok(validatePreviewProductVariantPayload({ combinations: Array.from({ length: 201 }, () => []) }).error);
  assert.equal(validatePreviewProductVariantPayload({ combinations: [['black', '38'], ['white', '39']] }).data.combinations.length, 2);
});

test('capacity warns near 50 and rejects combinations beyond 200', () => {
  assert.equal(variantCapacityResult(48, 1).warning, false);
  assert.equal(variantCapacityResult(49, 1).warning, true);
  assert.equal(variantCapacityResult(199, 1).allowed, true);
  assert.equal(variantCapacityResult(200, 1).allowed, false);
});

test('schema creates stable ProductVariant and exact one-option-per-attribute rows', () => {
  assert.match(schema, /model ProductVariant \{/);
  assert.match(schema, /@@unique\(\[productId, optionSignature\]\)/);
  assert.match(schema, /@@index\(\[productId, isActive\]\)/);
  assert.match(schema, /sku\s+String\?\s+@unique/);
  assert.match(schema, /model ProductVariantOption \{/);
  assert.match(schema, /@@id\(\[variantId, attributeId\]\)/);
  assert.match(schema, /references: \[id, attributeId\]/);
});

test('migration has one-default constraints and an idempotent deterministic backfill', () => {
  assert.match(migration, /ProductVariant_one_default_per_product/);
  assert.match(migration, /WHERE "isDefault" = true/);
  assert.match(migration, /ProductVariant_default_signature_consistency/);
  assert.match(migration, /'pv_default_' \|\| p\."id"/);
  assert.match(migration, /WHERE NOT EXISTS/);
  assert.match(migration, /ON CONFLICT \("productId", "optionSignature"\) DO NOTHING/);
});

test('migration is additive and does not mutate Product or unrelated business tables', () => {
  assert.doesNotMatch(migration, /^\s*(?:DROP|DELETE|TRUNCATE|UPDATE)\b/im);
  assert.doesNotMatch(migration, /"(?:Warehouse|Laptop|Cart|Order|Payment|Shipment)/);
  assert.equal((migration.match(/CREATE TABLE/g) || []).length, 2);
});

test('new Product creation transactionally creates its one default variant', () => {
  assert.match(productCreateRoute, /prisma\.\$transaction/);
  assert.match(productCreateRoute, /ensureDefaultProductVariant\(tx, created\.id\)/);
  assert.match(service, /productVariant\.upsert/);
  assert.match(service, /DEFAULT_PRODUCT_VARIANT_SIGNATURE/);
});

test('service validates complete active axes and does not force a Cartesian product', () => {
  assert.match(service, /isVariantDefining: true/);
  assert.match(service, /option\.isActive/);
  assert.match(service, /DUPLICATE_VARIANT_ATTRIBUTE/);
  assert.match(service, /ATTRIBUTE_NOT_VARIANT_AXIS/);
  assert.match(service, /INCOMPLETE_VARIANT_COMBINATION/);
  assert.doesNotMatch(service, /cartesian|flatMap\s*\(.*flatMap/is);
});

test('partial matrices persist only explicitly requested combinations', () => {
  assert.match(service, /createProductVariant/);
  assert.match(service, /optionIds/);
  assert.match(service, /productVariant\.create/);
  assert.doesNotMatch(service, /generateAll|createAllCombinations/);
});

test('duplicate signatures and globally unique SKUs return controlled conflicts', () => {
  assert.match(service, /VARIANT_SKU_EXISTS/);
  assert.match(service, /VARIANT_COMBINATION_EXISTS/);
  assert.match(service, /findUnique\(\{ where: \{ sku: data\.sku \}/);
  assert.match(service, /productId_optionSignature/);
  assert.match(service, /P2002/);
});

test('normal deletion endpoint deactivates and retains readable variant rows', () => {
  assert.match(variantRoutes, /deactivateProductVariant/);
  assert.match(service, /isActive: false/);
  assert.doesNotMatch(variantRoutes, /productVariant\.delete/);
});

test('category changes are blocked for non-default or incompatible product data', () => {
  assert.match(attributeService, /variants: \{ where: \{ isDefault: false \}/);
  assert.match(productRoute, /PRODUCT_CATEGORY_VARIANTS_IN_USE/);
  assert.match(productRoute, /PRODUCT_CATEGORY_ATTRIBUTES_INCOMPATIBLE/);
});

test('used variant axes cannot be removed or changed to informational', () => {
  assert.match(attributeService, /CATEGORY_ATTRIBUTE_VARIANT_IN_USE/g);
  assert.match(attributeService, /productVariantOption\.count/);
  assert.match(attributeService, /data\.isVariantDefining === false/);
});

test('option code identity is locked after variant use but deactivation remains available', () => {
  assert.match(attributeService, /variantOptions: true/);
  assert.match(attributeService, /OPTION_CODE_IN_USE/);
  assert.match(attributeService, /deactivateAttributeOption/);
  assert.doesNotMatch(attributeService, /attributeOption\.delete|productVariantOption\.deleteMany\(\{\s*where:\s*\{\s*attributeOptionId/);
});

test('all variant Admin APIs use existing Product RBAC and strict validators', () => {
  assert.match(variantRoutes, /PRODUCTS_VIEW/);
  assert.match(variantRoutes, /PRODUCTS_EDIT/g);
  assert.match(variantRoutes, /validateProductVariantEntityId/g);
  assert.match(variantRoutes, /validateCreateProductVariantPayload/);
  assert.match(variantRoutes, /validateReplaceProductVariantOptionsPayload/);
});

test('Product backend detail returns localized active variant option data without final selector UI', () => {
  for (const field of [
    'attributeId', 'attributeCode', 'attributeNameFa', 'attributeNameEn',
    'optionId', 'optionCode', 'labelFa', 'labelEn', 'swatchHex',
  ]) assert.match(service, new RegExp(field));
  assert.match(publicCatalog, /variants: \{/);
  assert.match(publicCatalog, /where: \{ isActive: true \}/);
  assert.match(publicCatalog, /publicVariantOptions/);
  assert.match(publicCatalog, /variantAxes/);
});
