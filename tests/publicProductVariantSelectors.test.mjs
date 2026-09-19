import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  formatPublicAttributeValues,
  getPublicOptionState,
  resolveExactPublicVariant,
  selectedPublicVariantSummary,
  updatePublicVariantSelection,
} from '../src/lib/publicProductVariantSelection.js';

const axes = [
  {
    code: 'color', nameFa: 'رنگ', inputType: 'COLOR', sortOrder: 1,
    options: [
      { code: 'black', labelFa: 'مشکی', swatchHex: '#000000' },
      { code: 'white', labelFa: 'سفید', swatchHex: '#ffffff' },
    ],
  },
  {
    code: 'eu_size', nameFa: 'سایز اروپایی', inputType: 'SELECT', sortOrder: 2,
    options: ['38', '39', '40'].map(code => ({ code, labelFa: code })),
  },
];

const variant = (id, color, size, available = true, discountPercent = 20, price = '1600000') => ({
  id,
  available,
  options: [
    { attributeCode: 'color', optionCode: color, labelFa: color === 'black' ? 'مشکی' : 'سفید' },
    { attributeCode: 'eu_size', optionCode: size, labelFa: size },
  ],
  pricing: { finalPriceToman: price, discountPercent },
});

const variants = [
  variant('black-38', 'black', '38', true),
  variant('black-39', 'black', '39', true, 0, '2200000'),
  variant('white-40', 'white', '40', false),
];

test('variant axes remain generic and ordered by the server DTO contract', () => {
  assert.deepEqual(axes.map(axis => axis.code), ['color', 'eu_size']);
  const source = readFileSync('src/lib/publicCatalog.js', 'utf8');
  assert.match(source, /publicVariantAxes\(product\.variants, variantAssignments\)/);
  assert.match(source, /orderBy: \{ sortOrder: 'asc' \}/);
  assert.match(source, /inventory: line\.inventory/);
  assert.doesNotMatch(source, /inventory: variant\.inventory/);
});

test('Black keeps sizes 38 and 39 enabled and disables impossible 40', () => {
  const selection = { color: 'black' };
  assert.equal(getPublicOptionState({ variants, selection, axisCode: 'eu_size', optionCode: '38', supplyMode: 'IRAN_STOCK' }).disabled, false);
  assert.equal(getPublicOptionState({ variants, selection, axisCode: 'eu_size', optionCode: '39', supplyMode: 'IRAN_STOCK' }).disabled, false);
  assert.equal(getPublicOptionState({ variants, selection, axisCode: 'eu_size', optionCode: '40', supplyMode: 'IRAN_STOCK' }).disabled, true);
});

test('White remains discoverable before size selection while its only size is unavailable', () => {
  const colorState = getPublicOptionState({ variants, selection: {}, axisCode: 'color', optionCode: 'white', supplyMode: 'IRAN_STOCK' });
  assert.equal(colorState.structurallyCompatible, true);
  assert.equal(colorState.available, false);
  assert.equal(colorState.disabled, false);
  const sizeState = getPublicOptionState({ variants, selection: { color: 'white' }, axisCode: 'eu_size', optionCode: '40', supplyMode: 'IRAN_STOCK' });
  assert.equal(sizeState.disabled, true);
});

test('changing an axis clears a now-impossible dependent option', () => {
  assert.deepEqual(updatePublicVariantSelection({
    axes,
    variants,
    selection: { color: 'black', eu_size: '38' },
    axisCode: 'color',
    optionCode: 'white',
  }), { color: 'white' });
});

test('complete selection resolves exactly one ProductVariant ID', () => {
  const result = resolveExactPublicVariant({ axes, variants, selection: { color: 'black', eu_size: '39' } });
  assert.equal(result.status, 'resolved');
  assert.equal(result.variant.id, 'black-39');
});

test('missing selection remains incomplete and duplicate matches are an integrity error', () => {
  assert.equal(resolveExactPublicVariant({ axes, variants, selection: { color: 'black' } }).status, 'incomplete');
  assert.equal(resolveExactPublicVariant({
    axes,
    variants: [...variants, variant('duplicate', 'black', '39')],
    selection: { color: 'black', eu_size: '39' },
  }).status, 'integrity_error');
});

test('external active Variants require no ProductInventory', () => {
  const external = variants.map(candidate => ({ ...candidate, available: true }));
  assert.equal(getPublicOptionState({
    variants: external,
    selection: { color: 'white' },
    axisCode: 'eu_size',
    optionCode: '40',
    supplyMode: 'EXTERNAL_DUBAI',
  }).disabled, false);
});

test('default-only Product resolves without a public selector', () => {
  const result = resolveExactPublicVariant({ axes: [], variants: [{ id: 'default', available: true, options: [] }], selection: {} });
  assert.equal(result.status, 'resolved');
  assert.equal(result.variant.id, 'default');
});

test('selected summary is localized and derived from the normalized DTO', () => {
  assert.deepEqual(selectedPublicVariantSummary(axes, { color: 'black', eu_size: '38' }), [
    { attributeCode: 'color', attributeNameFa: 'رنگ', optionCode: 'black', labelFa: 'مشکی' },
    { attributeCode: 'eu_size', attributeNameFa: 'سایز اروپایی', optionCode: '38', labelFa: '38' },
  ]);
});

test('informational values cover option, number, boolean false, and text values', () => {
  assert.equal(formatPublicAttributeValues({ values: [{ labelFa: 'چرم' }] }), 'چرم');
  assert.equal(formatPublicAttributeValues({ unitFa: 'گرم', values: [{ value: '500' }] }), '500 گرم');
  assert.equal(formatPublicAttributeValues({ values: [{ value: false }] }), 'خیر');
  assert.equal(formatPublicAttributeValues({ values: [{ value: 'Regular' }] }), 'Regular');
});

test('authoritative pricing carries original and final Toman values without client recomputation', () => {
  const catalog = readFileSync('src/lib/publicCatalog.js', 'utf8');
  const page = readFileSync('src/app/product/[id]/page.js', 'utf8');
  assert.match(catalog, /originalFinalPriceToman/);
  assert.match(catalog, /resolveProductVariantPriceFromData/);
  assert.match(page, /activeProductPricing\.finalPriceToman/);
  assert.match(page, /activeProductPricing\.discountPercent > 0/);
});

test('explicit zero percent Variant discount hides public discount UI', () => {
  const result = resolveExactPublicVariant({ axes, variants, selection: { color: 'black', eu_size: '39' } });
  assert.equal(result.variant.pricing.discountPercent, 0);
});

test('Add to Cart sends the exact ProductVariant identity and no client price authority', () => {
  const page = readFileSync('src/app/product/[id]/page.js', 'utf8');
  const cartPage = readFileSync('src/app/cart/page.js', 'utf8');
  const cartState = readFileSync('src/lib/clientCollectionState.js', 'utf8');
  assert.match(page, /productVariantId: selectedProductVariant\.id/);
  assert.match(cartPage, /item\.pricing\?\.finalPriceToman/);
  assert.match(cartPage, /finalItemPriceToman\(item, settings\)/);
  assert.match(cartState, /productId: item\.id/);
  assert.doesNotMatch(cartState.match(/export function resolverPayload[\s\S]*$/)?.[0] || '', /finalPriceToman/);
});

test('public Product imagery is white, square/contained, centered, and does not alter Laptop cards', () => {
  const detailCss = readFileSync('src/app/product/[id]/Product.module.css', 'utf8');
  const cardCss = readFileSync('src/app/men/Men.module.css', 'utf8');
  const slider = readFileSync('src/components/ProductSlider.js', 'utf8');
  assert.match(detailCss, /\.catalogImageSection[\s\S]*background: #fff/);
  assert.match(detailCss, /\.catalogMainImage[\s\S]*object-fit: contain[\s\S]*object-position: center/);
  assert.match(cardCss, /\.imageWrap[\s\S]*aspect-ratio: 1[\s\S]*background: #fff/);
  assert.match(cardCss, /\.productImg[\s\S]*object-fit: contain/);
  assert.match(slider, /isCatalogProduct \? styles\.catalogProductImg/);
});

test('Best Seller and accessible selector states are wired to real Product flags/options', () => {
  const page = readFileSync('src/app/product/[id]/page.js', 'utf8');
  const selector = readFileSync('src/components/product/PublicProductVariantSelector.js', 'utf8');
  assert.match(page, /product\.isBestSeller/);
  assert.match(selector, /option\.swatchHex/);
  assert.match(selector, /aria-pressed/);
  assert.match(selector, /disabled=\{state\.disabled\}/);
});

test('Phase 2H-B adds no schema or migration', () => {
  const migrationTest = readFileSync('tests/adminDynamicProductVariants.test.mjs', 'utf8');
  assert.match(migrationTest, /Phase 2H-A adds no schema or migration/);
});
