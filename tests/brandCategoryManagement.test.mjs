import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  resolveBrandCreateVisibility,
  validateBrandCreatePayload,
  validateBrandUpdatePayload,
  validateCategoryIds,
} from '../src/lib/adminBrands.js';

test('quick-created brands are always hidden from the public directory', () => {
  assert.equal(resolveBrandCreateVisibility({ quickCreate: true, requestedVisibility: true }), false);
  assert.equal(resolveBrandCreateVisibility({ quickCreate: false, requestedVisibility: false }), false);
  assert.equal(resolveBrandCreateVisibility(), true);
});

test('brand category IDs are deduplicated and invalid IDs are rejected', () => {
  assert.deepEqual(validateCategoryIds(['cat_1', 'cat_1', 'cat-2']).value, ['cat_1', 'cat-2']);
  assert.match(validateCategoryIds(['../unsafe']).error, /شناسه دسته‌بندی/);
  assert.match(validateCategoryIds('cat_1').error, /فهرست دسته‌بندی/);
});

test('brand create and update payloads validate visibility and category mappings', () => {
  const created = validateBrandCreatePayload({
    name: '  New   Brand  ',
    categoryIds: ['category_1'],
    quickCreate: true,
    showInBrandDirectory: false,
  });
  assert.equal(created.data.name, 'New Brand');
  assert.deepEqual(created.categoryIds, ['category_1']);
  assert.equal(created.quickCreate, true);
  assert.match(validateBrandUpdatePayload({ showInBrandDirectory: 'yes' }).error, /وضعیت نمایش/);
});

test('migration keeps existing brands visible and backfills legacy category matches', async () => {
  const sql = await readFile(
    new URL('../prisma/migrations/20260824000100_brand_visibility_categories/migration.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /"showInBrandDirectory" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(sql, /CREATE TABLE "BrandCategory"/);
  assert.match(sql, /LOWER\(BTRIM\(b\."cat"\)\) = LOWER\(BTRIM\(c\."name"\)\)/);
  assert.doesNotMatch(sql, /DROP TABLE|DELETE FROM "Brand"|TRUNCATE/i);
});
