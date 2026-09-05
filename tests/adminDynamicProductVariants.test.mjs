import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import {
  buildVariantOptionCombinations,
  normalizeAdminProductConfigurationPayload,
} from '../src/lib/adminProductConfigurationDomain.js';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const [
  component,
  css,
  service,
  domain,
  inventoryService,
  createRoute,
  editRoute,
  categoryRoute,
  brandSelector,
  schema,
] = await Promise.all([
  read('src/components/admin/products/AdminProductConfigurator.js'),
  read('src/components/admin/products/AdminProductConfigurator.module.css'),
  read('src/lib/adminProductConfigurationService.js'),
  read('src/lib/adminProductConfigurationDomain.js'),
  read('src/lib/productInventoryService.js'),
  read('src/app/api/admin/products/configuration/route.js'),
  read('src/app/api/admin/products/[id]/configuration/route.js'),
  read('src/app/api/admin/categories/[id]/product-configuration/route.js'),
  read('src/components/admin/AdminBrandSelector.js'),
  read('prisma/schema.prisma'),
]);

function payload(variant = {}) {
  return {
    product: { nameFa: 'کفش', nameEn: 'Shoes' },
    attributeValues: [],
    variants: [{
      optionIds: [],
      sku: '',
      priceAedOverride: null,
      priceTomanOverride: null,
      discountPercentOverride: null,
      weightOverride: null,
      inventory: null,
      ...variant,
    }],
  };
}

test('variant builder creates the complete candidate matrix product but does not choose combinations itself', () => {
  assert.deepEqual(buildVariantOptionCombinations([
    ['black', 'white'],
    ['38', '39'],
  ]), [
    ['black', '38'],
    ['black', '39'],
    ['white', '38'],
    ['white', '39'],
  ]);
  assert.match(component, /effectiveSelectedKeys/);
  assert.match(component, /حداقل یک ترکیب قابل فروش/);
});

test('a selective matrix payload persists only submitted rows', () => {
  const result = normalizeAdminProductConfigurationPayload({
    ...payload(),
    variants: [
      { ...payload().variants[0], optionIds: ['black', '38'] },
      { ...payload().variants[0], optionIds: ['white', '39'] },
    ],
  });
  assert.equal(result.error, undefined);
  assert.deepEqual(result.data.variants.map(row => row.optionIds), [
    ['black', '38'],
    ['white', '39'],
  ]);
});

test('blank overrides normalize to null while explicit zero discount remains zero', () => {
  const inherited = normalizeAdminProductConfigurationPayload(payload());
  const explicitZero = normalizeAdminProductConfigurationPayload(payload({ discountPercentOverride: 0 }));
  assert.equal(inherited.data.variants[0].discountPercentOverride, null);
  assert.equal(explicitZero.data.variants[0].discountPercentOverride, 0);
  assert.match(component, /خالی = ارث‌بری؛ ۰ = بدون تخفیف/);
});

test('inventory input accepts stock/min/location only and never accepts reserved or available', () => {
  const accepted = normalizeAdminProductConfigurationPayload(payload({
    inventory: { stock: 5, minStock: 1, location: 'A-1' },
  }));
  assert.deepEqual(accepted.data.variants[0].inventory, { stock: 5, minStock: 1, location: 'A-1' });
  assert.match(normalizeAdminProductConfigurationPayload(payload({
    inventory: { stock: 5, minStock: 1, reserved: 2 },
  })).error, /غیرمجاز/);
});

test('dynamic Admin inputs cover all six Phase 2A input types and Persian-first labels', () => {
  for (const type of ['SELECT', 'MULTI_SELECT', 'COLOR', 'TEXT', 'NUMBER', 'BOOLEAN']) {
    assert.match(component, new RegExp(type));
  }
  assert.match(component, /nameFa/);
  assert.match(component, /nameEn/);
  assert.match(component, /swatchHex/);
  assert.match(component, /unitFa/);
});

test('category configuration returns only active definitions and options in deterministic order', () => {
  assert.match(service, /attribute: \{ isActive: true \}/);
  assert.match(service, /orderBy: \[\{ sortOrder: 'asc' \}, \{ createdAt: 'asc' \}\]/);
  assert.match(service, /filter\(option => option\.isActive\)/);
  assert.match(categoryRoute, /getAdminCategoryProductConfiguration/);
});

test('required attributes and category-owned options are enforced on the server', () => {
  assert.match(service, /validateResolvedProductAttributeValues/);
  assert.match(service, /INVALID_CATEGORY_OPTION/);
  assert.match(service, /INCOMPLETE_VARIANT_COMBINATION/);
});

test('new and edited Product configuration use one serializable orchestrated service', () => {
  assert.match(service, /runSerializableWithRetry\(client, async tx/);
  assert.match(createRoute, /saveAdminProductConfiguration\(prisma/);
  assert.match(editRoute, /saveAdminProductConfiguration\(prisma/);
  assert.match(editRoute, /partial: true/);
  assert.match(service, /timeout: 20_000/);
});

test('editing matches by optionSignature and preserves an existing Variant ID', () => {
  assert.match(service, /existingBySignature\.get\(row\.optionSignature\)/);
  assert.match(service, /match\.id !== row\.id/);
  assert.match(service, /where: \{ id: match\.id \}/);
  assert.doesNotMatch(service, /productVariant\.delete/);
});

test('removed combinations are deactivated and active reservations block removal', () => {
  assert.match(service, /stale\.inventory\?\.reservations\.length/);
  assert.match(service, /VARIANT_ACTIVE_RESERVATION/);
  assert.match(service, /data: \{ isActive: false \}/);
});

test('Iran inventory initialization and stock edits reuse movement-producing Phase 2E functions', () => {
  assert.match(service, /initializeProductInventoryInTransaction/);
  assert.match(service, /adjustProductInventoryStockInTransaction/);
  assert.match(service, /ویرایش موجودی از فرم محصول/);
  assert.match(inventoryService, /type: 'ADJUSTMENT'/);
  assert.match(inventoryService, /stockAfter < current\.reserved/);
});

test('supply mode UX keeps external and Iran pricing paths explicit', () => {
  assert.match(component, /EXTERNAL_DUBAI/);
  assert.match(component, /IRAN_STOCK/);
  assert.match(component, /سفارش از دبی/);
  assert.match(component, /موجود در ایران/);
  assert.match(service, /EXTERNAL_INVENTORY_NOT_ALLOWED/);
  assert.match(service, /IRAN_INVENTORY_REQUIRED/);
});

test('category and supply-mode changes have controlled server conflicts', () => {
  assert.match(service, /PRODUCT_CATEGORY_CONFIGURATION_IN_USE/);
  assert.match(service, /PRODUCT_INVENTORY_RESERVATION_ACTIVE/);
  assert.match(service, /reserved: \{ gt: 0 \}/);
});

test('simple Products retain exactly one hidden default Variant without a fake selector', () => {
  assert.deepEqual(buildVariantOptionCombinations([]), [[]]);
  assert.match(service, /DEFAULT_PRODUCT_VARIANT_SIGNATURE/);
  assert.match(service, /محصول ساده باید دقیقاً یک تنوع پیش‌فرض داشته باشد/);
  assert.match(component, /تنوع پیش‌فرض داخلی بدون نمایش انتخاب‌گر ساختگی حفظ می‌شود/);
});

test('inline Brand creation remains available without a laptop allowlist', () => {
  assert.match(component, /<AdminBrandSelector/);
  assert.match(brandSelector, /fetch\('\/api\/admin\/brands'/);
  assert.match(brandSelector, /quickCreate: true/);
  assert.doesNotMatch(brandSelector, /supportsLaptop/);
});

test('Admin configuration routes preserve Product RBAC and controlled JSON errors', () => {
  assert.match(createRoute, /ADMIN_PERMISSIONS\.PRODUCTS_CREATE/);
  assert.match(editRoute, /ADMIN_PERMISSIONS\.PRODUCTS_EDIT/);
  assert.match(editRoute, /ADMIN_PERMISSIONS\.PRODUCTS_VIEW/);
  assert.match(categoryRoute, /ADMIN_PERMISSIONS\.PRODUCTS_VIEW/);
  assert.match(createRoute, /normalizeAdminProductConfigurationPayload/);
  assert.match(domain, /فیلد غیرمجاز در تنظیمات تنوع/);
});

test('responsive configurator contains width at 390, 430, 768 and desktop layouts', () => {
  assert.match(css, /width: min\(1120px, 100%\)/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /overflow-x: hidden/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
});

test('Phase 2H-A adds no schema or migration and uses the existing foundation', async () => {
  const migrations = await readdir(new URL('prisma/migrations/', root));
  assert.equal(migrations.filter(name => name.includes('2h')).length, 0);
  for (const model of [
    'CatalogAttribute',
    'CategoryAttribute',
    'ProductAttributeValue',
    'ProductVariant',
    'ProductVariantOption',
    'ProductInventory',
  ]) {
    assert.match(schema, new RegExp('model ' + model + ' \\{'));
  }
});
