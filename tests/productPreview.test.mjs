import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { isSupportedProductStore, parseExternalHttpUrl } from '../src/lib/externalUrlPolicy.js';
import { fetchProductPage, MAX_PRODUCT_HTML_BYTES, readLimitedHtml } from '../src/lib/productPreview/fetchProductPage.js';
import { normalizePreviewImageUrl } from '../src/lib/productPreview/imageUrl.js';
import { parseAedTextPrice, parseProductHtml } from '../src/lib/productPreview/parser.js';

async function fixture(name) {
  return readFile(new URL(`./fixtures/product-preview/${name}`, import.meta.url), 'utf8');
}

test('product preview: Noon JSON-LD wins and returns current AED price, explicit brand/category, and no weight', async () => {
  const result = parseProductHtml(await fixture('noon.html'), new URL('https://www.noon.com/uae-en/product/example'));
  assert.equal(result.source, 'noon');
  assert.equal(result.fields.title, 'Ophidia Small Shoulder Bag');
  assert.equal(result.fields.brand, 'Gucci');
  assert.equal(result.fields.priceAed, 599);
  assert.equal(result.fields.categorySuggestion, 'bags');
  assert.equal(result.fields.weight, null);
  assert.equal(result.fields.variant, 'Black');
  assert.equal(result.confidence.priceAed, 'high');
});

test('product preview: Amazon UAE ignores installment copy and reads the actual Product offer', async () => {
  const result = parseProductHtml(await fixture('amazon-ae.html'), new URL('https://www.amazon.ae/dp/B000000001'));
  assert.equal(result.source, 'amazon_uae');
  assert.equal(result.fields.brand, 'Sony');
  assert.equal(result.fields.priceAed, 1299);
  assert.equal(parseAedTextPrice('AED 108.25 per month with installments'), null);
});

test('product preview: Namshi adapter chooses current price rather than the old struck price', async () => {
  const result = parseProductHtml(await fixture('namshi.html'), new URL('https://www.namshi.com/uae-en/product/example'));
  assert.equal(result.source, 'namshi');
  assert.equal(result.fields.title, 'Cloud 6 Running Shoes');
  assert.equal(result.fields.brand, 'On Running');
  assert.equal(result.fields.priceAed, 660);
  assert.equal(result.confidence.priceAed, 'medium');
});

test('product preview: missing price and brand remain null rather than fabricated', async () => {
  const result = parseProductHtml(await fixture('missing-price.html'), new URL('https://www.noon.com/uae-en/product/unpriced'));
  assert.equal(result.fields.priceAed, null);
  assert.equal(result.fields.brand, null);
  assert.equal(result.fields.weight, null);
  assert.ok(result.warnings.includes('PRICE_NOT_FOUND'));
  assert.ok(result.warnings.includes('BRAND_NOT_FOUND'));
});

test('product preview: malformed HTML remains a safe partial result', () => {
  const result = parseProductHtml('<html><script type="application/ld+json">{bad</script><h1>Fallback title', new URL('https://www.noon.com/p/example'));
  assert.equal(result.fields.title, 'Fallback title');
  assert.equal(result.fields.priceAed, null);
});

test('product preview: OpenGraph fallback requires an explicit AED currency', () => {
  const html = '<meta property="og:title" content="Meta Product"><meta property="product:price:amount" content="799"><meta property="product:price:currency" content="AED">';
  const result = parseProductHtml(html, new URL('https://www.noon.com/product/meta'));
  assert.equal(result.fields.title, 'Meta Product');
  assert.equal(result.fields.priceAed, 799);
  assert.equal(result.confidence.priceAed, 'medium');
});

test('product preview: source-specific embedded product JSON is used before metadata', () => {
  const html = '<script id="__NEXT_DATA__" type="application/json">{"props":{"product":{"productId":"N1","title":"Embedded Noon Bag","brandName":"Coach","category":"Handbags","currentPrice":{"value":950,"currency":"AED"}}}}</script><meta property="og:title" content="Fallback">';
  const result = parseProductHtml(html, new URL('https://www.noon.com/product/embedded'));
  assert.equal(result.fields.title, 'Embedded Noon Bag');
  assert.equal(result.fields.brand, 'Coach');
  assert.equal(result.fields.priceAed, 950);
  assert.equal(result.confidence.priceAed, 'high');
});

test('product preview: coupon-only JSON-LD offer is not accepted as a current price', () => {
  const html = '<script type="application/ld+json">{"@type":"Product","name":"Coupon Product","offers":{"@type":"Offer","price":250,"priceCurrency":"AED","description":"AED 250 with code SAVE"}}</script>';
  const result = parseProductHtml(html, new URL('https://www.noon.com/product/coupon'));
  assert.equal(result.fields.priceAed, null);
});

test('URL policy rejects unsupported protocols, internal destinations, credentials, and custom ports', () => {
  assert.equal(parseExternalHttpUrl('file:///etc/passwd'), null);
  assert.equal(parseExternalHttpUrl('http://127.0.0.1/x'), null);
  assert.equal(parseExternalHttpUrl('http://[::1]/x'), null);
  assert.equal(parseExternalHttpUrl('https://metadata.google.internal/x'), null);
  assert.equal(parseExternalHttpUrl('http://169.254.169.254/latest/meta-data'), null);
  assert.equal(parseExternalHttpUrl('https://user:pass@noon.com/x'), null);
  assert.equal(parseExternalHttpUrl('https://noon.com:8443/x'), null);
  assert.ok(parseExternalHttpUrl('https://noon.com/product/x'));
  assert.equal(isSupportedProductStore(new URL('https://example.com/product/x')), false);
});

test('image URL handling resolves safe relative URLs and rejects unsafe protocols/private targets', () => {
  assert.equal(
    normalizePreviewImageUrl('/images/item.jpg', new URL('https://www.noon.com/product/x')),
    'https://www.noon.com/images/item.jpg',
  );
  assert.equal(normalizePreviewImageUrl('data:text/html,unsafe', new URL('https://www.noon.com/product/x')), null);
  assert.equal(normalizePreviewImageUrl('http://127.0.0.1/image.jpg', new URL('https://www.noon.com/product/x')), null);
});

test('secure fetch validates every redirect and rejects unsupported redirect destinations', async () => {
  const inspected = [];
  const fetchImpl = async url => new Response(null, {
    status: 302,
    headers: { location: url.hostname === 'noon.com' ? 'https://example.com/product' : '/done' },
  });
  await assert.rejects(
    fetchProductPage('https://noon.com/product', {
      fetchImpl,
      assertDestination: async url => inspected.push(url.hostname),
    }),
    /UNSUPPORTED_STORE/,
  );
  assert.deepEqual(inspected, ['noon.com', 'example.com']);
});

test('secure fetch rejects invalid Content-Type', async () => {
  const response = new Response('{}', { headers: { 'content-type': 'application/json' } });
  await assert.rejects(readLimitedHtml(response), /INVALID_CONTENT_TYPE/);
});

test('secure fetch rejects a body larger than the decompressed limit', async () => {
  const response = new Response('x'.repeat(MAX_PRODUCT_HTML_BYTES + 1), { headers: { 'content-type': 'text/html' } });
  await assert.rejects(readLimitedHtml(response), /RESPONSE_TOO_LARGE/);
});

test('price parser requires explicit AED and rejects coupon-only values', () => {
  assert.equal(parseAedTextPrice('USD 599'), null);
  assert.equal(parseAedTextPrice('AED 599 with code SAVE20'), null);
  assert.equal(parseAedTextPrice('AED 599 AED 899'), null);
  assert.equal(parseAedTextPrice('AED 599'), 599);
});

test('frontend uses POST, aborts stale preview requests, keeps title editable, and leaves weight manual', async () => {
  const calculator = await readFile(new URL('../src/components/Calculator.js', import.meta.url), 'utf8');
  assert.match(calculator, /fetch\('\/api\/product-preview'/);
  assert.match(calculator, /method: 'POST'/);
  assert.match(calculator, /previewControllerRef\.current\?\.abort\(\)/);
  assert.match(calculator, /previewRequestIdRef\.current !== requestId/);
  assert.match(calculator, /value=\{productTitle\}/);
  assert.doesNotMatch(calculator, /product\.weight <= 1|fields\.weight/);
  assert.match(calculator, /اطلاعات محصول خودکار دریافت نشد/);
});

test('Admin Products reuses the same Product Preview endpoint and does not consume extracted weight', async () => {
  const adminProducts = await readFile(new URL('../src/app/admin/products/page.js', import.meta.url), 'utf8');
  assert.match(adminProducts, /fetch\('\/api\/product-preview'/);
  assert.match(adminProducts, /method: 'POST'/);
  assert.doesNotMatch(adminProducts, /product\.weight/);
});

test('Product Preview route wraps public-request guard failures in NextResponse', async () => {
  const route = await readFile(new URL('../src/app/api/product-preview/route.js', import.meta.url), 'utf8');
  assert.match(route, /if \(guard\) return NextResponse\.json/);
});
