import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import {
  STANDARD_CATALOG_ATTRIBUTES,
  STANDARD_CATALOG_CATEGORIES,
  buildStandardCatalogPresetPlan,
  normalizeCatalogPresetLookup,
  summarizeStandardCatalogPresetPlan,
} from '../src/lib/standardCatalogPresets.js';
import {
  databaseEndpointIdentity,
  installStandardCatalogPresets,
} from '../src/lib/standardCatalogPresetService.js';

const currentPreviewCategories = [
  { id: 'home', name: 'خانه و سبک زندگی', query: 'home' },
  { id: 'beauty', name: 'زیبایی و سلامت', query: 'beauty' },
  { id: 'accessories', name: 'ساعت و اکسسوری', query: 'accessories' },
  { id: 'other', name: 'سایر کالاها', query: 'other' },
  { id: 'fashion', name: 'مد و پوشاک', query: 'fashion' },
  { id: 'tech', name: 'موبایل و الکترونیک', query: 'tech' },
  { id: 'shoes', name: 'کیف و کفش', query: 'shoes' },
];

function categoryPreset(key) {
  return STANDARD_CATALOG_CATEGORIES.find(category => category.key === key);
}

function assignment(categoryKey, attributeCode) {
  return categoryPreset(categoryKey).assignments.find(item => item.attributeCode === attributeCode);
}

function createMemoryClient(initial = {}) {
  const state = {
    categories: structuredClone(initial.categories || []),
    attributes: structuredClone(initial.attributes || []),
    options: structuredClone(initial.options || []),
    assignments: structuredClone(initial.assignments || []),
  };
  let counter = 0;
  const nextId = prefix => `${prefix}-${++counter}`;
  const client = {
    state,
    category: {
      findMany: async () => structuredClone(state.categories),
      createMany: async ({ data }) => {
        state.categories.push(...structuredClone(data));
        return { count: data.length };
      },
    },
    catalogAttribute: {
      findMany: async () => state.attributes.map(row => ({
        ...structuredClone(row),
        options: structuredClone(state.options.filter(optionRow => optionRow.attributeId === row.id)),
      })),
      createMany: async ({ data }) => {
        state.attributes.push(...data.map(row => ({
          id: nextId('attribute'), createdAt: new Date(0), updatedAt: new Date(0), ...structuredClone(row),
        })));
        return { count: data.length };
      },
    },
    attributeOption: {
      createMany: async ({ data }) => {
        state.options.push(...data.map(row => ({
          id: nextId('option'), createdAt: new Date(0), updatedAt: new Date(0), ...structuredClone(row),
        })));
        return { count: data.length };
      },
    },
    categoryAttribute: {
      findMany: async () => structuredClone(state.assignments),
      createMany: async ({ data }) => {
        state.assignments.push(...data.map(row => ({
          id: nextId('assignment'), createdAt: new Date(0), updatedAt: new Date(0), ...structuredClone(row),
        })));
        return { count: data.length };
      },
    },
    $transaction: async operation => operation(client),
  };
  return client;
}

test('standard library uses unique stable codes and deterministic option ordering', () => {
  assert.equal(STANDARD_CATALOG_ATTRIBUTES.length, 22);
  assert.equal(new Set(STANDARD_CATALOG_ATTRIBUTES.map(item => item.code)).size, 22);
  assert.equal(STANDARD_CATALOG_ATTRIBUTES.reduce((total, item) => total + item.options.length, 0), 221);
  for (const attribute of STANDARD_CATALOG_ATTRIBUTES) {
    assert.equal(new Set(attribute.options.map(item => item.code)).size, attribute.options.length);
  }
  const plan = buildStandardCatalogPresetPlan();
  const colorSortOrders = plan.create.options
    .filter(item => item.attributeCode === 'color')
    .map(item => item.sortOrder);
  assert.deepEqual(colorSortOrders, colorSortOrders.map((_, index) => (index + 1) * 10));
  assert.equal(STANDARD_CATALOG_ATTRIBUTES.find(item => item.code === 'shade').inputType, 'MULTI_SELECT');
  assert.equal(STANDARD_CATALOG_ATTRIBUTES.find(item => item.code === 'volume_ml').unitEn, 'ml');
  assert.equal(STANDARD_CATALOG_ATTRIBUTES.find(item => item.code === 'weight_g').unitEn, 'g');
});

test('standard categories and assignments have stable identifiers without duplicate mappings', () => {
  assert.equal(STANDARD_CATALOG_CATEGORIES.length, 27);
  assert.equal(new Set(STANDARD_CATALOG_CATEGORIES.map(item => item.id)).size, 27);
  assert.equal(new Set(STANDARD_CATALOG_CATEGORIES.map(item => item.query)).size, 27);
  assert.equal(STANDARD_CATALOG_CATEGORIES.reduce((total, item) => total + item.assignments.length, 0), 94);
  for (const category of STANDARD_CATALOG_CATEGORIES) {
    assert.equal(new Set(category.assignments.map(item => item.attributeCode)).size, category.assignments.length);
  }
});

test('equivalent Persian and English category lookups normalize safely', () => {
  assert.equal(normalizeCatalogPresetLookup('  كيف و كفش  '), normalizeCatalogPresetLookup('کیف و کفش'));
  const plan = buildStandardCatalogPresetPlan({ categories: currentPreviewCategories });
  const summary = summarizeStandardCatalogPresetPlan(plan);
  assert.equal(summary.willCreate.categories, 25);
  assert.equal(summary.willReuse.categories, 2);
  assert.deepEqual(plan.reuse.categories.map(item => item.id).sort(), ['accessories', 'tech']);
  assert.equal(plan.reuse.categories.some(item => item.id === 'shoes'), false);
});

test('empty-state plan creates every attribute, option, category, and assignment exactly once', () => {
  assert.deepEqual(summarizeStandardCatalogPresetPlan(buildStandardCatalogPresetPlan()).willCreate, {
    attributes: 22,
    options: 221,
    categories: 27,
    assignments: 94,
  });
});

test('Shoes mappings require Color and EU Size while keeping Material and Fit informational', () => {
  for (const key of ['womens-shoes', 'mens-shoes', 'kids-shoes']) {
    assert.deepEqual(categoryPreset(key).assignments.map(item => item.attributeCode), [
      'color', 'shoe_size_eu', 'material', 'fit',
    ]);
    assert.deepEqual(assignment(key, 'color'), {
      attributeCode: 'color', isRequired: true, isVariantDefining: true, allowsMultiple: true,
    });
    assert.equal(assignment(key, 'shoe_size_eu').isRequired, true);
    assert.equal(assignment(key, 'material').isVariantDefining, false);
  }
});

test('Bags mappings never include EU Shoe Size', () => {
  for (const key of ['womens-bags', 'mens-bags', 'backpacks']) {
    assert.deepEqual(categoryPreset(key).assignments.map(item => item.attributeCode), ['color', 'bag_size', 'material']);
    assert.equal(categoryPreset(key).assignments.some(item => item.attributeCode === 'shoe_size_eu'), false);
  }
});

test('general Clothing uses Color and Clothing Size while trousers use Waist and Length', () => {
  assert.deepEqual(categoryPreset('womens-clothing').assignments.map(item => item.attributeCode), [
    'color', 'clothing_size', 'material', 'fit',
  ]);
  assert.deepEqual(categoryPreset('womens-pants').assignments.map(item => item.attributeCode), [
    'color', 'waist_size', 'length_size', 'material', 'fit',
  ]);
  assert.equal(categoryPreset('womens-pants').assignments.some(item => item.attributeCode === 'clothing_size'), false);
  assert.equal(assignment('womens-pants', 'length_size').isRequired, false);
});

test('Perfume uses required variant Volume and informational Concentration only', () => {
  assert.deepEqual(categoryPreset('perfume-fragrance').assignments.map(item => item.attributeCode), [
    'volume_ml', 'fragrance_concentration',
  ]);
  assert.equal(assignment('perfume-fragrance', 'volume_ml').isRequired, true);
  assert.equal(assignment('perfume-fragrance', 'volume_ml').isVariantDefining, true);
});

test('Makeup, Skincare, Haircare, and Nail presets avoid irrelevant size axes', () => {
  assert.deepEqual(categoryPreset('makeup').assignments.map(item => item.attributeCode), [
    'shade', 'volume_ml', 'finish', 'skin_type',
  ]);
  assert.deepEqual(categoryPreset('skincare').assignments.map(item => item.attributeCode), [
    'volume_ml', 'weight_g', 'skin_type',
  ]);
  assert.equal(assignment('skincare', 'volume_ml').isRequired, false);
  assert.equal(assignment('skincare', 'weight_g').isRequired, false);
  assert.deepEqual(categoryPreset('haircare').assignments.map(item => item.attributeCode), ['volume_ml', 'weight_g']);
  assert.deepEqual(categoryPreset('nail-products').assignments.map(item => item.attributeCode), ['shade', 'volume_ml']);
});

test('Supplements allow unflavored products and Electronics keeps every variant axis optional', () => {
  assert.deepEqual(categoryPreset('supplements').assignments.map(item => item.attributeCode), [
    'flavor', 'weight_g', 'serving_count',
  ]);
  assert.equal(assignment('supplements', 'flavor').isRequired, false);
  assert.deepEqual(categoryPreset('electronics').assignments.map(item => item.attributeCode), ['color', 'storage', 'ram']);
  assert.equal(categoryPreset('electronics').assignments.every(item => item.isRequired === false), true);
});

test('Watches and Sunglasses use category-specific axes', () => {
  assert.deepEqual(categoryPreset('watches').assignments.map(item => item.attributeCode), [
    'color', 'watch_case_size', 'strap_material', 'material',
  ]);
  assert.deepEqual(categoryPreset('sunglasses').assignments.map(item => item.attributeCode), [
    'frame_color', 'lens_color', 'material',
  ]);
});

test('dry run reports proposed writes without mutating data', async () => {
  const client = createMemoryClient({ categories: currentPreviewCategories });
  const before = structuredClone(client.state);
  const result = await installStandardCatalogPresets(client, { dryRun: true });
  assert.equal(result.preflight.willCreate.categories, 25);
  assert.deepEqual(client.state, before);
});

test('installer is idempotent and a second run creates no duplicates', async () => {
  const client = createMemoryClient({ categories: currentPreviewCategories });
  const first = await installStandardCatalogPresets(client);
  assert.deepEqual(first.created, { attributes: 22, options: 221, categories: 25, assignments: 94 });
  assert.deepEqual(first.final.willCreate, { attributes: 0, options: 0, categories: 0, assignments: 0 });
  const countsAfterFirst = Object.fromEntries(Object.entries(client.state).map(([key, rows]) => [key, rows.length]));
  const second = await installStandardCatalogPresets(client);
  assert.deepEqual(second.created, { attributes: 0, options: 0, categories: 0, assignments: 0 });
  assert.deepEqual(Object.fromEntries(Object.entries(client.state).map(([key, rows]) => [key, rows.length])), countsAfterFirst);
});

test('existing custom attribute, option, and assignment configuration is preserved and reported', async () => {
  const client = createMemoryClient({
    categories: [{ id: 'custom-shoes', name: 'کفش زنانه', query: 'custom-shoes' }],
    attributes: [{
      id: 'custom-color', code: 'COLOR', nameFa: 'رنگ سفارشی', nameEn: 'Custom Color', inputType: 'COLOR',
      unitFa: null, unitEn: null, isActive: true, sortOrder: 999,
    }],
    options: [{
      id: 'custom-black', attributeId: 'custom-color', code: 'BLACK', labelFa: 'سیاه سفارشی', labelEn: 'Custom Black',
      swatchHex: '#000000', isActive: true, sortOrder: 999,
    }],
    assignments: [{
      id: 'custom-assignment', categoryId: 'custom-shoes', attributeId: 'custom-color', isRequired: false,
      isVariantDefining: false, allowsMultiple: false, sortOrder: 999,
    }],
  });
  const result = await installStandardCatalogPresets(client);
  assert.equal(client.state.attributes.find(item => item.id === 'custom-color').nameFa, 'رنگ سفارشی');
  assert.equal(client.state.options.find(item => item.id === 'custom-black').labelFa, 'سیاه سفارشی');
  assert.equal(client.state.assignments.find(item => item.id === 'custom-assignment').isVariantDefining, false);
  assert.equal(result.final.conflicts.some(item => item.type === 'ATTRIBUTE_CONFIGURATION_PRESERVED'), true);
  assert.equal(result.final.conflicts.some(item => item.type === 'OPTION_CONFIGURATION_PRESERVED'), true);
  assert.equal(result.final.conflicts.some(item => item.type === 'ASSIGNMENT_CONFIGURATION_PRESERVED'), true);
});

test('incompatible existing attribute types are preserved and their unsafe assignments are skipped', () => {
  const plan = buildStandardCatalogPresetPlan({
    attributes: [{
      id: 'custom-color', code: 'color', inputType: 'TEXT', nameFa: 'رنگ', nameEn: 'Color', isActive: true,
      sortOrder: 10, unitFa: null, unitEn: null, options: [],
    }],
  });
  assert.equal(plan.create.attributes.some(item => item.code === 'color'), false);
  assert.equal(plan.create.assignments.some(item => item.attributeCode === 'color'), false);
  assert.equal(plan.conflicts.some(item => item.type === 'ATTRIBUTE_INCOMPATIBLE'), true);
  assert.equal(plan.conflicts.some(item => item.type === 'ASSIGNMENT_SKIPPED_INCOMPATIBLE_ATTRIBUTE'), true);
});

test('database endpoint guard reports identities without revealing credentials', () => {
  assert.equal(
    databaseEndpointIdentity('postgresql://placeholder@ep-divine-band-askp3a2z-pooler.example.test/db'),
    'ep-divine-band-askp3a2z',
  );
});

test('preset remains explicit, editable, migration-free, and absent from automatic deployment scripts', async () => {
  const root = new URL('../', import.meta.url);
  const [pkg, script, schema, migrations] = await Promise.all([
    readFile(new URL('package.json', root), 'utf8'),
    readFile(new URL('scripts/seed-standard-catalog.mjs', root), 'utf8'),
    readFile(new URL('prisma/schema.prisma', root), 'utf8'),
    readdir(new URL('prisma/migrations/', root)),
  ]);
  const parsedPackage = JSON.parse(pkg);
  assert.equal(parsedPackage.scripts['seed:catalog-presets'], 'node scripts/seed-standard-catalog.mjs');
  assert.equal(parsedPackage.scripts.postinstall.includes('seed-standard-catalog'), false);
  assert.match(script, /--dry-run/);
  assert.match(script, /--apply/);
  assert.match(script, /--expect-db-endpoint/);
  assert.match(schema, /model CatalogAttribute/);
  assert.equal(migrations.some(name => name.includes('standard_catalog')), false);
});
