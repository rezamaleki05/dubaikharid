import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  MAX_LAPTOP_IMAGES,
  isOwnedLaptopBlobPathname,
  laptopReferencesBlob,
  ownedLaptopBlobPathnameFromUrl,
  ownedLaptopBlobPathnames,
} from '../src/lib/laptopImageOwnership.js';
import {
  LAPTOP_IMAGE_MAX_BYTES,
  LAPTOP_IMAGE_TYPES,
  validateLaptopImage,
} from '../src/lib/laptopImageValidation.js';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const [
  schema,
  adminLaptops,
  laptopListRoute,
  laptopDetailRoute,
  uploadRoute,
  storage,
  uploader,
  laptopPage,
  productUploadRoute,
  productGalleryTests,
] = await Promise.all([
  read('prisma/schema.prisma'),
  read('src/lib/adminLaptops.js'),
  read('src/app/api/admin/laptops/route.js'),
  read('src/app/api/admin/laptops/[id]/route.js'),
  read('src/app/api/admin/laptops/upload/route.js'),
  read('src/lib/laptopImageStorage.js'),
  read('src/components/admin/laptops/LaptopImageUploader.js'),
  read('src/app/admin/laptops/page.js'),
  read('src/app/api/admin/products/upload/route.js'),
  read('tests/productMultiImageGallery.test.mjs'),
]);

const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0x00]);
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const pathname = 'laptops/2026/123e4567-e89b-12d3-a456-426614174000.webp';
const blobUrl = `https://example.public.blob.vercel-storage.com/${pathname}`;

test('Laptop image validation supports only signature-matched JPG, PNG, and WebP up to 10 MB', () => {
  assert.equal(LAPTOP_IMAGE_MAX_BYTES, 10 * 1024 * 1024);
  assert.deepEqual(LAPTOP_IMAGE_TYPES, ['image/jpeg', 'image/png', 'image/webp']);
  assert.deepEqual(validateLaptopImage({ type: 'image/jpeg', size: jpeg.length, bytes: jpeg }), { type: 'image/jpeg', extension: 'jpg' });
  assert.deepEqual(validateLaptopImage({ type: 'image/png', size: png.length, bytes: png }), { type: 'image/png', extension: 'png' });
  assert.deepEqual(validateLaptopImage({ type: 'image/webp', size: webp.length, bytes: webp }), { type: 'image/webp', extension: 'webp' });
  assert.match(validateLaptopImage({ type: 'image/png', size: jpeg.length, bytes: jpeg }).error, /مطابقت/);
  assert.match(validateLaptopImage({ type: 'image/gif', size: jpeg.length, bytes: jpeg }).error, /فرمت/);
  assert.match(validateLaptopImage({ type: 'image/jpeg', size: LAPTOP_IMAGE_MAX_BYTES + 1, bytes: jpeg }).error, /۱۰ مگابایت/);
  assert.match(validateLaptopImage({ type: 'image/jpeg', size: 0, bytes: jpeg }).error, /خالی/);
});

test('Laptop Blob ownership is strictly isolated from Product and Warehouse paths', () => {
  assert.equal(MAX_LAPTOP_IMAGES, 12);
  assert.equal(isOwnedLaptopBlobPathname(pathname), true);
  assert.equal(isOwnedLaptopBlobPathname('products/2026/123e4567-e89b-12d3-a456-426614174000.webp'), false);
  assert.equal(isOwnedLaptopBlobPathname('warehouse/2026/123e4567-e89b-12d3-a456-426614174000.webp'), false);
  assert.equal(isOwnedLaptopBlobPathname('laptops/2026/not-a-uuid.webp'), false);
  assert.equal(ownedLaptopBlobPathnameFromUrl(blobUrl), pathname);
  assert.equal(ownedLaptopBlobPathnameFromUrl('data:image/png;base64,AAAA'), null);
});

test('reference detection covers both Laptop image and JSON gallery URLs', () => {
  const laptop = { image: blobUrl, images: [blobUrl, 'https://cdn.example.com/external.jpg'] };
  assert.equal(laptopReferencesBlob(laptop, pathname), true);
  assert.deepEqual(ownedLaptopBlobPathnames(laptop), [pathname]);
  assert.equal(laptopReferencesBlob({ image: null, images: [] }, pathname), false);
});

test('dedicated upload route authorizes Laptop editing before reading or mutating uploads', () => {
  const authorization = uploadRoute.indexOf('authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.LAPTOPS_EDIT)');
  assert.ok(authorization >= 0);
  assert.ok(authorization < uploadRoute.indexOf('request.formData()'));
  assert.match(uploadRoute, /export async function POST/);
  assert.match(uploadRoute, /export async function DELETE/);
  assert.match(uploadRoute, /laptops\/\$\{new Date\(\)\.getUTCFullYear\(\)\}\/\$\{randomUUID\(\)\}/);
  assert.match(uploadRoute, /getLaptopBlobAuthOptions/);
  assert.match(uploadRoute, /فضای ذخیره‌سازی تصویر هنوز تنظیم نشده است/);
});

test('orphan cleanup rejects arbitrary paths, checks every Laptop reference, and deletes only owned blobs', () => {
  assert.match(uploadRoute, /isOwnedLaptopBlobPathname\(body\.blobPathname\)/);
  assert.match(uploadRoute, /cleanup\.referenced\.includes\(body\.blobPathname\)/);
  assert.match(storage, /client\.laptop\.findMany/);
  assert.match(storage, /laptopReferencesBlob\(laptop, pathname\)/);
  assert.match(storage, /await del\(pathname, blobAuth\)/);
  assert.doesNotMatch(storage, /productImage\.(?:delete|update)/);
  assert.doesNotMatch(storage, /warehouseItem/);
});

test('Laptop form provides one real picker and drag/drop pipeline with partial-success feedback', () => {
  assert.match(uploader, /type="file"/);
  assert.match(uploader, /multiple/);
  assert.match(uploader, /accept=\{LAPTOP_IMAGE_TYPES\.join\(','\)\}/);
  assert.match(uploader, /onDragEnter/);
  assert.match(uploader, /onDragOver/);
  assert.match(uploader, /onDragLeave/);
  assert.match(uploader, /onDrop/);
  assert.match(uploader, /uploadFiles\(event\.dataTransfer\.files\)/);
  assert.match(uploader, /const files = \[\.\.\.\(event\.target\.files \|\| \[\]\)\];\s+event\.target\.value = '';/);
  assert.match(uploader, /successes \? `\$\{successes\} تصویر آپلود شد/);
  assert.match(uploader, /در حال آپلود/);
  assert.match(laptopPage, /disabled=\{isLaptopImageUploading \|\| isLaptopSaving\}/);
});

test('gallery order owns the primary image and supports primary, reorder, and remove controls', () => {
  assert.match(uploader, /next\.unshift\(selected\)/);
  assert.match(uploader, /makePrimary\(index\)/);
  assert.match(uploader, /move\(index, -1\)/);
  assert.match(uploader, /move\(index, 1\)/);
  assert.match(uploader, /removeImage\(image, index\)/);
  assert.match(adminLaptops, /data\.image = data\.images\[0\] \|\| null/);
  assert.match(laptopPage, /images: laptopImages\.map\(image => image\.url\)/);
});

test('Laptop payload keeps the existing JSON URL array and enforces the 12-image maximum', () => {
  assert.match(schema, /image\s+String\?/);
  assert.match(schema, /images\s+Json\?/);
  assert.doesNotMatch(schema, /model LaptopImage/);
  assert.match(adminLaptops, /Array\.isArray\(value\) \|\| value\.length > 12/);
  assert.match(laptopListRoute, /prisma\.laptop\.create/);
  assert.match(laptopDetailRoute, /tx\.laptop\.update/);
});

test('persisted-image cleanup runs only after a successful Laptop update transaction', () => {
  const transaction = laptopDetailRoute.indexOf('const result = await prisma.$transaction');
  const cleanup = laptopDetailRoute.indexOf('await deleteUnreferencedLaptopBlobs');
  const response = laptopDetailRoute.indexOf('return NextResponse.json(serializeLaptop(result.laptop))');
  assert.ok(transaction >= 0 && cleanup > transaction && response > cleanup);
  assert.match(laptopDetailRoute, /ownedLaptopBlobPathnames\(result\.previous\)/);
  assert.match(laptopDetailRoute, /ownedLaptopBlobPathnames\(result\.laptop\)/);
  assert.match(uploader, /cleanupUnsavedLaptopImages/);
  assert.match(laptopPage, /cleanupUnsavedLaptopImages\(laptopImages\)/);
});

test('Laptop without images remains valid and public primary image still derives from images[0]', () => {
  assert.match(adminLaptops, /data\.image = data\.images\[0\] \|\| null/);
  assert.match(adminLaptops, /const image = laptop\.image \|\| images\[0\] \|\| null/);
  assert.match(adminLaptops, /serialized\.image \|\| '\/images\/product-placeholder\.svg'/);
  assert.doesNotMatch(laptopPage, /images.*required/);
});

test('Product upload architecture and regression coverage remain unchanged', () => {
  assert.match(productUploadRoute, /products\/\$\{new Date\(\)\.getUTCFullYear\(\)\}/);
  assert.match(productUploadRoute, /authorizeAdminApiRequestAny/);
  assert.match(productUploadRoute, /validateProductImage/);
  assert.match(productGalleryTests, /ProductImage schema and migration are additive/);
  assert.match(productGalleryTests, /Blob cleanup is ownership-scoped/);
  assert.doesNotMatch(uploadRoute, /PRODUCTS_(?:CREATE|EDIT)/);
});
