import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { canOptimizePublicImage, PUBLIC_BLOB_IMAGE_HOST } from '../src/lib/publicImagePolicy.js';
const read = path => readFile(new URL(path, import.meta.url), 'utf8');
test('only first-party public media is eligible for server optimization', () => {
  for (const url of ['/images/headerBG .png', '/images/Dubai Purchase Request.png', `https://${PUBLIC_BLOB_IMAGE_HOST}/products/example.webp`]) assert.equal(canOptimizePublicImage(url), true);
  for (const url of ['http://'+PUBLIC_BLOB_IMAGE_HOST+'/a.png', 'https://private.example/a.png', 'https://'+PUBLIC_BLOB_IMAGE_HOST+'.attacker.test/a.png', 'https://'+PUBLIC_BLOB_IMAGE_HOST+'/a.png?token=private', '/images/../secret.png', '/api/customer.png', '//localhost/a.png', 'data:image/png;base64,AAAA', 'https://user:secret@'+PUBLIC_BLOB_IMAGE_HOST+'/a.png']) assert.equal(canOptimizePublicImage(url), false, url);
});
test('LCP hero uses the same decorative source/crop with responsive preload and no duplicate CSS download', async () => {
  const source=await read('../src/components/Hero.js'),css=await read('../src/components/Hero.module.css');
  assert.match(source,/src="\/images\/headerBG \.png" alt="" fill loading="eager" fetchPriority="high" sizes="100vw" quality=\{90\}/);
  assert.match(source,/rel="preload" as="image" imageSrcSet=\{heroPreload.srcSet\} imageSizes=\{heroPreload.sizes\} fetchPriority="high"/);
  assert.match(source,/objectFit: 'cover', objectPosition: 'center 20%'/);assert.match(css,/background-image: none/);
});
test('gallery keeps original full-resolution zoom on demand while responsive main/thumb images retain identity', async () => {
  const source=await read('../src/components/product/PublicProductGallery.js');
  assert.match(source,/lightboxOpen && <img src=\{selected.url\}/);assert.match(source,/publicImageDelivery\(selected.url,/);assert.match(source,/publicImageDelivery\(image.url, '76px'\)/);assert.match(source,/fetchPriority="high"/);assert.match(source,/setLightboxOpen\(false\)/);
});
test('below-fold Homepage cards are lazy and brand discovery reserves only its existing frame', async () => {
  assert.match(await read('../src/components/ProductSlider.js'),/loading="lazy" decoding="async"/);
  assert.match(await read('../src/components/BrandLogosBar.js'),/return loaded \? null : <section/);
  assert.match(await read('../src/components/BrandLogosBar.module.css'),/min-height: 84px/);
});
test('unused remote font stylesheet is removed while local typography is preserved', async () => {
  const css=await read('../src/app/globals.css'),layout=await read('../src/app/layout.js');
  assert.doesNotMatch(css,/@import.*fonts.googleapis.com/);assert.match(layout,/Vazirmatn/);assert.match(css,/var\(--font-vazirmatn\)/);
});
