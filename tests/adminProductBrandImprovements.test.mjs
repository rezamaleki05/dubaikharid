import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function importSource(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const brandModule = await importSource('../src/lib/adminBrands.js');
const imageModule = await importSource('../src/lib/productImageValidation.js');

test('brand names are trimmed and internal whitespace is normalized', () => {
  assert.equal(brandModule.normalizeBrandName('  Nike   Sports  '), 'Nike Sports');
  assert.equal(brandModule.validateBrandCreatePayload({ name: '  Nike  ' }).data.name, 'Nike');
  assert.equal(brandModule.brandNameLookupKey('  NIKE '), brandModule.brandNameLookupKey('nike'));
});

test('brand payload rejects empty names and unsafe URLs', () => {
  assert.match(brandModule.validateBrandCreatePayload({ name: '   ' }).error, /نام برند/);
  assert.match(brandModule.validateBrandCreatePayload({ name: 'Nike', url: 'javascript:alert(1)' }).error, /آدرس/);
});

test('JPEG, PNG and WEBP signatures are recognized', () => {
  assert.equal(imageModule.detectProductImageMime(new Uint8Array([0xff, 0xd8, 0xff])), 'image/jpeg');
  assert.equal(imageModule.detectProductImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png');
  assert.equal(imageModule.detectProductImageMime(new TextEncoder().encode('RIFF0000WEBP')), 'image/webp');
});

test('image validation rejects empty, oversized, unsupported and spoofed files', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff]);
  assert.match(imageModule.validateProductImage({ type: 'image/jpeg', size: 0, bytes: jpeg }).error, /خالی/);
  assert.match(imageModule.validateProductImage({ type: 'image/jpeg', size: imageModule.PRODUCT_IMAGE_MAX_BYTES + 1, bytes: jpeg }).error, /۴ مگابایت/);
  assert.match(imageModule.validateProductImage({ type: 'image/gif', size: 3, bytes: jpeg }).error, /فرمت/);
  assert.match(imageModule.validateProductImage({ type: 'image/png', size: 3, bytes: jpeg }).error, /مطابقت ندارد/);
});
