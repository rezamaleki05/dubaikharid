import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { orderingEvidence, shoeEvidence, laptopInspectionEvidence, storeGuideLinks } from '../src/lib/organicGrowthContent.js';
import { guides, brandGuides } from '../src/lib/commerceGuides.js';
import { calculateProductPricing } from '../src/lib/pricing.js';
import { collectionSeoState } from '../src/lib/collectionSeoDomain.js';

const read = path => fs.readFileSync(path, 'utf8');

test('ordering examples retain distinct source-specific selection criteria', () => {
  assert.equal(new Set(Object.values(orderingEvidence).map(x => x.title)).size, 5);
  assert.match(JSON.stringify(orderingEvidence.amazon), /ارسال‌کننده/);
  assert.match(JSON.stringify(orderingEvidence.noon), /نسخه کشور/);
  assert.match(JSON.stringify(orderingEvidence.namshi), /US زنانه/);
  assert.match(JSON.stringify(orderingEvidence.shein), /SKU/);
  assert.match(JSON.stringify(orderingEvidence.nike), /کد سبک/);
});

test('customer evidence tables have accessible complete row/column relationships', () => {
  for (const evidence of [...Object.values(orderingEvidence), shoeEvidence, laptopInspectionEvidence]) {
    assert.ok(evidence.intro.length > 100);
    assert.ok(evidence.closing.length > 100);
    assert.ok(evidence.rows.length >= 4);
    assert.ok(evidence.rows.every(row => row.length === evidence.columns.length && row.every(cell => cell.trim())));
  }
  const renderer = read('src/components/seo/ContentEvidence.js');
  assert.match(renderer, /scope="col"/);
  assert.match(renderer, /scope="row"/);
  assert.match(renderer, /<caption>/);
});

test('example pricing follows the real configurable rounding and commission rules', () => {
  const settings = { aedRate: 100, commissionPercent: 10, shippingPerKgAed: 20, minWeightClass: 1, roundingMethod: 'ceil' };
  const ceil = calculateProductPricing({ priceAed: 200, weight: 1.2 }, settings);
  assert.equal(ceil.billableWeight, 2);
  assert.equal(ceil.totalToman, 26000);
  const floor = calculateProductPricing({ priceAed: 200, weight: 1.2 }, { ...settings, roundingMethod: 'floor' });
  assert.equal(floor.billableWeight, 1);
  assert.equal(floor.totalToman, 24000);
  assert.throws(() => calculateProductPricing({ priceAed: 200, weight: 1.2 }, {}));
  const example = read('src/components/seo/CostEstimateExample.js');
  assert.match(example, /await getPricingSettings\(\)/);
  assert.match(example, /مربوط به محصول یا سفارش واقعی نیستند/);
  assert.match(example, /عددی نمایش داده نمی‌شود/);
  assert.doesNotMatch(example, /updateSettings|fetch\(|upsert|\.create\(/);
});

test('Laptop criteria never masquerade as completed inspections or invented results', () => {
  assert.match(laptopInspectionEvidence.intro, /نه گزارش تست/);
  assert.match(JSON.stringify(laptopInspectionEvidence), /نامعلوم/);
  assert.match(JSON.stringify(laptopInspectionEvidence), /تست مستند/);
  assert.doesNotMatch(JSON.stringify(laptopInspectionEvidence), /تست شده|تضمین سلامت|تضمین عملکرد/);
});

test('store contextual links lead to existing public destinations, without Adidas fiction', () => {
  const allowed = new Set(['/guides/uae-store-comparison', '/guides/shoe-sizing', '/electronics', '/beauty-health', '/sports-shoes', '/clothing', '/buy-from-dubai']);
  for (const links of Object.values(storeGuideLinks)) for (const [url, label] of links) {
    assert.ok(allowed.has(url.split('#')[0]), url);
    assert.ok(label.trim());
  }
  assert.ok(guides['temu-ordering'].links.some(([url]) => url === '/buy-from-dubai#cost-example'));
  assert.ok(brandGuides.nike.links.some(([url]) => url === '/guides/shoe-sizing'));
  assert.equal(orderingEvidence.adidas, undefined);
});

test('shoe facets remain navigation states with one clean canonical destination', () => {
  assert.equal(collectionSeoState('/sports-shoes', { sub: 'shoes' }).noindex, true);
  assert.equal(collectionSeoState('/women', { sub: 'shoes' }).noindex, true);
  const layout = read('src/app/sports-shoes/layout.js');
  assert.match(layout, /path: '\/sports-shoes'/);
  const page = read('src/app/sports-shoes/page.js');
  assert.match(page, /await connection\(\)/);
  assert.match(page, /breadcrumbSchema\(crumbs\)/);
  assert.doesNotMatch(page, /'use client'|<h1/);
});

test('stock guidance links only real loaded model groups and the existing inspection guide', () => {
  const page = read('src/app/stock-laptops/page.js');
  assert.match(page, /section\.groups\.map/);
  assert.match(page, /href=\{`\/laptops\/\$\{group.slug\}`\}/);
  assert.match(page, /href="\/guides\/stock-laptop-checklist"/);
  assert.doesNotMatch(page, /workstation-selection|precision-vs-zbook|laptop-display-selection/);
});

test('content expansion does not add fake rich results or mutate catalog data', () => {
  for (const file of ['src/lib/organicGrowthContent.js', 'src/components/seo/ContentEvidence.js', 'src/components/seo/CostEstimateExample.js']) {
    assert.doesNotMatch(read(file), /AggregateRating|Review|HowTo|FAQPage|prisma\..*(create|update|delete|upsert)/);
  }
});
