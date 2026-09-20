import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  MAX_PRODUCT_IMAGES,
  getProductCoverImage,
  getProductPrimaryImage,
  isOwnedProductBlobPathname,
  normalizeProductImagesInput,
  serializeProductImages,
} from '../src/lib/productGallery.js';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const [
  schema,
  migration,
  adminGallery,
  adminGalleryCss,
  configurator,
  configurationDomain,
  configurationService,
  uploadRoute,
  storage,
  publicCatalog,
  publicGallery,
  publicGalleryCss,
  detailPage,
  detailPageCss,
  cartDomain,
] = await Promise.all([
  read('prisma/schema.prisma'),
  read('prisma/migrations/20260920000100_product_multi_image_gallery/migration.sql'),
  read('src/components/admin/products/AdminProductGalleryField.js'),
  read('src/components/admin/products/AdminProductGalleryField.module.css'),
  read('src/components/admin/products/AdminProductConfigurator.js'),
  read('src/lib/adminProductConfigurationDomain.js'),
  read('src/lib/adminProductConfigurationService.js'),
  read('src/app/api/admin/products/upload/route.js'),
  read('src/lib/productImageStorage.js'),
  read('src/lib/publicCatalog.js'),
  read('src/components/product/PublicProductGallery.js'),
  read('src/components/product/PublicProductGallery.module.css'),
  read('src/app/product/[id]/page.js'),
  read('src/app/product/[id]/Product.module.css'),
  read('src/lib/productCartDomain.js'),
]);

const image = (url, extra = {}) => ({ url, isPrimary: false, ...extra });

test('gallery input enforces the ten-image limit, safe URLs, unique rows, and one primary', () => {
  assert.equal(MAX_PRODUCT_IMAGES, 10);
  assert.match(normalizeProductImagesInput(Array.from({ length: 11 }, (_, index) => image(`https://cdn.example.com/${index}.jpg`))).error, /حداکثر 10/);
  assert.match(normalizeProductImagesInput([image('data:image/png;base64,AAAA')]).error, /آدرس تصویر/);
  assert.match(normalizeProductImagesInput([
    image('https://cdn.example.com/a.jpg'),
    image('https://cdn.example.com/a.jpg'),
  ]).error, /تکراری/);
  assert.match(normalizeProductImagesInput([
    image('https://cdn.example.com/a.jpg', { isPrimary: true }),
    image('https://cdn.example.com/b.jpg', { isPrimary: true }),
  ]).error, /فقط یک تصویر/);
});

test('missing primary is normalized deterministically and ordering is request-owned', () => {
  const result = normalizeProductImagesInput([
    image('https://cdn.example.com/portrait.jpg', { sortOrder: 99 }),
    image('https://cdn.example.com/landscape.jpg', { sortOrder: -1 }),
    image('https://cdn.example.com/square.jpg'),
  ]);
  assert.equal(result.error, undefined);
  assert.deepEqual(result.data.map(row => row.sortOrder), [0, 1, 2]);
  assert.deepEqual(result.data.map(row => row.isPrimary), [true, false, false]);
});

test('cover resolver prefers explicit primary, then ordered gallery, legacy image, then placeholder', () => {
  const product = {
    image: '/legacy.jpg',
    images: [
      { id: 'later', url: '/later.jpg', sortOrder: 2, isPrimary: true },
      { id: 'first', url: '/first.jpg', sortOrder: 0, isPrimary: false },
    ],
  };
  assert.equal(getProductCoverImage(product, '/placeholder.svg'), '/later.jpg');
  assert.equal(getProductPrimaryImage(product).id, 'later');
  assert.deepEqual(serializeProductImages(product).map(row => row.id), ['first', 'later']);
  assert.equal(getProductCoverImage({ image: '/legacy.jpg', images: [] }, '/placeholder.svg'), '/legacy.jpg');
  assert.equal(getProductCoverImage({ image: null, images: [] }, '/placeholder.svg'), '/placeholder.svg');
});

test('ProductImage schema and migration are additive, ordered, cascading, and primary-safe', () => {
  assert.match(schema, /images\s+ProductImage\[\]/);
  assert.match(schema, /model ProductImage \{/);
  assert.doesNotMatch(schema, /model ProductVariantImage/);
  assert.match(migration, /CREATE TABLE "ProductImage"/);
  assert.match(migration, /ON DELETE CASCADE/);
  assert.match(migration, /WHERE "isPrimary" = true/);
  assert.doesNotMatch(migration, /^\s*(?:DROP|DELETE|TRUNCATE|UPDATE|RENAME)\b/im);
});

test('Admin configurator supports multi-upload previews, primary selection, reorder, removal, and optional alt text', () => {
  assert.match(adminGallery, /multiple/);
  assert.match(adminGallery, /makePrimary/);
  assert.match(adminGallery, /move\(index, -1\)/);
  assert.match(adminGallery, /remove\(index\)/);
  assert.match(adminGallery, /altFa/);
  assert.match(adminGallery, /altEn/);
  assert.match(adminGallery, /MAX_PRODUCT_IMAGES/);
  assert.match(configurator, /uploadProductGallery\(images\)/);
  assert.match(configurator, /images: galleryResult\.images/);
});

test('gallery rows save in the existing serializable Product transaction and preserve existing identities', () => {
  assert.match(configurationDomain, /normalizeProductImagesInput/);
  assert.match(configurationService, /runSerializableWithRetry\(client, async tx/);
  assert.match(configurationService, /if \(data\.slug !== undefined\)/);
  assert.match(configurationService, /synchronizeProductImages\(tx, product\.id, images\)/);
  assert.match(configurationService, /tx\.productImage\.updateMany/);
  assert.match(configurationService, /tx\.productImage\.update\(\{ where: \{ id: image\.id \}/);
  assert.match(configurationService, /PRODUCT_IMAGE_IDENTITY_MISMATCH/);
});

test('Blob cleanup is ownership-scoped, reference-checked, and runs after database commit', () => {
  assert.equal(isOwnedProductBlobPathname('products/2026/123e4567-e89b-12d3-a456-426614174000.webp'), true);
  assert.equal(isOwnedProductBlobPathname('warehouse/2026/123e4567-e89b-12d3-a456-426614174000.webp'), false);
  assert.match(uploadRoute, /blobPathname: blob\.pathname/);
  assert.match(uploadRoute, /export async function DELETE/);
  assert.match(storage, /productImage\.count/);
  assert.match(storage, /references > 0/);
  assert.match(storage, /VERCEL_OIDC_TOKEN/);
  assert.match(storage, /BLOB_STORE_ID/);
  assert.match(uploadRoute, /getProductBlobAuthOptions/);
  const committedCleanup = configurationService.indexOf('await deleteUnreferencedProductBlobs');
  const transactionEnd = configurationService.indexOf("}, { retryUnique: true, timeout: 20_000 });");
  assert.ok(committedCleanup > transactionEnd);
  assert.match(configurator, /cleanupProductUploads\(uploadedPathnames\)/);
});

test('public DTO exposes gallery data while every card and cart line receive one centralized cover', () => {
  assert.match(publicCatalog, /images,/);
  assert.match(publicCatalog, /primaryImage/);
  assert.match(publicCatalog, /getProductCoverImage\(product, PUBLIC_PRODUCT_PLACEHOLDER\)/);
  assert.match(cartDomain, /getProductCoverImage\(product, ''\)/);
});

test('public detail is an accessible contained gallery with responsive horizontal thumbnails', () => {
  assert.match(detailPage, /<PublicProductGallery/);
  assert.match(publicGallery, /aria-pressed=\{active\}/);
  assert.match(publicGallery, /altFa \|\| selected\.altEn \|\| productName/);
  assert.match(publicGalleryCss, /object-fit: contain/);
  assert.match(publicGalleryCss, /overflow-x: auto/);
  assert.match(publicGalleryCss, /@media \(max-width: 430px\)/);
  assert.match(publicGalleryCss, /@media \(max-width: 390px\)/);
  assert.match(adminGalleryCss, /@media \(max-width: 430px\)/);
  assert.match(detailPageCss, /\.productName\s*\{[^}]*overflow-wrap: anywhere/s);
});
