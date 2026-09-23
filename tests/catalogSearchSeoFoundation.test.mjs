import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildLaptopModelGroups,
  laptopModelBaseSlug,
  laptopModelIdentity,
  searchLaptopModelGroups,
} from '../src/lib/laptopSeoDomain.js';
import { meaningfulSearchTerms, normalizeSearchText } from '../src/lib/searchNormalization.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

function laptop(overrides = {}) {
  return {
    id: 'lap-1',
    name: 'لپ تاپ استوک Dell مدل Precision 5530',
    brand: 'Dell',
    model: 'Precision 5530',
    cpu: 'Core i7 8850H',
    ram: '32GB',
    storage: '512GB SSD',
    secondaryStorage: null,
    gpu: 'NVIDIA Quadro P1000',
    screen: '15.6',
    manufactureYear: 2019,
    batteryHealth: 86,
    condition: 'very_good',
    priceToman: '48000000',
    image: '/precision.jpg',
    images: ['/precision.jpg'],
    description: 'دستگاه استوک موجود',
    status: 'AVAILABLE',
    archivedAt: null,
    reservedOrderId: null,
    updatedAt: new Date('2026-09-20T00:00:00.000Z'),
    serialNumber: 'PRIVATE-SERIAL',
    internalSku: 'PRIVATE-SKU',
    ...overrides,
  };
}

test('Persian search normalization unifies Arabic yeh and kaf and whitespace', () => {
  assert.equal(normalizeSearchText('  كفش   دبي  '), 'کفش دبی');
  assert.equal(normalizeSearchText('يک مدل'), 'یک مدل');
});

test('shopping-intent filler is removed without losing the product term', () => {
  assert.deepEqual(meaningfulSearchTerms('خرید کفش از دبی'), ['کفش', 'دبی']);
});

test('Laptop model identity is stable across case and whitespace', () => {
  assert.equal(laptopModelIdentity(' Dell ', 'PRECISION 5530'), laptopModelIdentity('dell', 'Precision 5530'));
});

test('Laptop model slug follows the clean Brand plus Model strategy', () => {
  assert.equal(laptopModelBaseSlug('Dell', 'Precision 5530'), 'dell-precision-5530');
});

test('multiple physical units collapse into one model SEO identity', () => {
  const groups = buildLaptopModelGroups([
    laptop(),
    laptop({ id: 'lap-2', ram: '64GB', storage: '1TB SSD', priceToman: '52000000' }),
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].slug, 'dell-precision-5530');
  assert.equal(groups[0].availableCount, 2);
  assert.equal(groups[0].lowPriceToman, '48000000');
  assert.equal(groups[0].highPriceToman, '52000000');
  assert.equal(groups[0].priceVaries, true);
});

test('non-sellable physical units never create public model inventory', () => {
  const groups = buildLaptopModelGroups([
    laptop({ status: 'SOLD' }),
    laptop({ id: 'lap-2', reservedOrderId: 'order-1' }),
    laptop({ id: 'lap-3', archivedAt: new Date() }),
    laptop({ id: 'lap-4', priceToman: '0' }),
  ]);
  assert.deepEqual(groups, []);
});

test('public model groups omit serial and internal SKU values', () => {
  const [group] = buildLaptopModelGroups([laptop()]);
  const serialized = JSON.stringify(group);
  assert.doesNotMatch(serialized, /PRIVATE-SERIAL|PRIVATE-SKU/);
  assert.equal(Object.hasOwn(group.units[0], 'serialNumber'), false);
  assert.equal(Object.hasOwn(group.units[0], 'internalSku'), false);
});

test('Laptop search matches brand plus model and specifications without duplicate units', () => {
  const groups = buildLaptopModelGroups([
    laptop(),
    laptop({ id: 'lap-2', ram: '64GB' }),
    laptop({ id: 'lap-3', brand: 'HP', model: 'ZBook 15 G6', name: 'HP ZBook 15 G6', ram: '16GB', gpu: 'Quadro T1000' }),
  ]);
  assert.deepEqual(searchLaptopModelGroups(groups, 'Dell Precision').map(group => group.slug), ['dell-precision-5530']);
  assert.deepEqual(searchLaptopModelGroups(groups, 'HP ZBook').map(group => group.slug), ['hp-zbook-15-g6']);
  assert.equal(searchLaptopModelGroups(groups, '32GB').length, 1);
});

test('Laptop Stock landing has the exact single strategic H1 and natural support copy', () => {
  const source = read('src/app/stock-laptops/page.js');
  assert.match(source, /const TITLE = 'لپ تاپ استوک \| خرید و قیمت لپ تاپ استوک'/);
  assert.equal((source.match(/<h1/g) || []).length, 1);
  assert.match(source, /Dell، HP و Lenovo/);
});

test('Laptop filter permutations canonicalize to the landing and become noindex', () => {
  const source = read('src/app/stock-laptops/page.js');
  assert.match(source, /await searchParams/);
  assert.match(source, /hasFilters \? NOINDEX_METADATA/);
  assert.match(source, /path: '\/stock-laptops'/);
});

test('Laptop model metadata and H1 derive only from real Brand plus Model', () => {
  const source = read('src/app/laptops/[slug]/page.js');
  assert.match(source, /title: `\$\{group\.brand\} \$\{group\.model\} استوک \| قیمت و خرید`/);
  assert.match(source, /<h1>\{group\.name\}<\/h1>/);
  assert.doesNotMatch(source, /مناسب Premiere|مناسب AutoCAD/);
});

test('Laptop structured data is truthful, used, aggregate, and review-free', () => {
  const source = read('src/app/laptops/[slug]/page.js');
  assert.match(source, /'@type': 'Product'/);
  assert.match(source, /'@type': 'AggregateOffer'/);
  assert.match(source, /UsedCondition/);
  assert.match(source, /lowPrice/);
  assert.match(source, /highPrice/);
  assert.match(source, /offerCount/);
  assert.match(source, /InStock/);
  assert.doesNotMatch(source, /aggregateRating|reviewCount|gtin|mpn/i);
});

test('physical-unit pages are noindex and canonicalized to their model', () => {
  const source = read('src/app/product/[id]/layout.js');
  assert.match(source, /item\.kind === 'laptop' \? item\.canonicalPath/);
  assert.match(source, /robots: \{ index: false, follow: true \}/);
});

test('Product metadata uses canonical Product identity and Phase 2I-A primary image', () => {
  const layout = read('src/app/product/[id]/layout.js');
  const data = read('src/lib/publicSeoData.js');
  assert.match(layout, /path: item\.kind === 'laptop' \? item\.canonicalPath : `\/product\/\$\{item\.id\}`/);
  assert.match(layout, /image: item\.image/);
  assert.match(data, /getProductCoverImage\(product, null\)/);
});

test('client settings never overwrite route-specific Next metadata titles', () => {
  const source = read('src/context/SiteSettingsContext.js');
  assert.doesNotMatch(source, /document\.title\s*=/);
});

test('Product search covers names, code, brand, category, Variant SKU, and option labels', () => {
  const source = read('src/lib/publicCatalog.js');
  for (const field of ['nameFa', 'nameEn', 'code', 'brand', 'category', 'sku', 'labelFa', 'labelEn']) {
    assert.match(source, new RegExp(field));
  }
});

test('search results expose one Laptop model result and search stays noindex follow', () => {
  const api = read('src/app/api/products/route.js');
  const layout = read('src/app/search/layout.js');
  assert.match(api, /searchPublicLaptopModels/);
  assert.match(api, /laptopModels/);
  assert.match(layout, /NOINDEX_METADATA/);
  assert.match(layout, /path: '\/search'/);
});

test('shared Product listing DTO exposes authoritative variant price summary', () => {
  const source = read('src/lib/publicCatalog.js');
  assert.match(source, /priceSummary: publicProductCardPriceSummary/);
  assert.match(source, /minimumFinalPriceToman/);
  assert.match(source, /maximumFinalPriceToman/);
  assert.match(source, /availableVariantCount/);
});

test('sitemap emits unique model URLs instead of physical Laptop unit URLs', () => {
  const source = read('src/app/sitemap.js');
  assert.match(source, /getPublicLaptopModelGroups/);
  assert.match(source, /`\/laptops\/\$\{model\.slug\}`/);
  assert.doesNotMatch(source, /laptops\.map\(laptop.*`\/product\/\$\{laptop\.id\}`/s);
  assert.doesNotMatch(source, /variant/i);
});

test('robots keeps public catalog crawlable while blocking private surfaces', () => {
  const source = read('src/app/robots.js');
  assert.match(source, /allow: '\/'/);
  for (const route of ['/admin/', '/api/', '/profile/', '/payment', '/cart', '/login']) {
    assert.match(source, new RegExp(route.replaceAll('/', '\\/')));
  }
});

test('Phase 2I-B adds no Prisma schema migration', () => {
  const migrationDirectories = fs.readdirSync(path.join(root, 'prisma/migrations'));
  assert.equal(migrationDirectories.some(name => /catalog.*search.*seo|phase.?2i.?b/i.test(name)), false);
});
