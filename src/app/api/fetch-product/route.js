import { NextResponse } from 'next/server';
import { getProductPreview } from '@/lib/productPreview';
import { publicRequestGuard } from '@/lib/publicRequestGuard';

const CLIENT_ERRORS = new Set([
  'INVALID_URL',
  'UNSUPPORTED_STORE',
  'PRIVATE_DESTINATION',
  'INVALID_REDIRECT',
  'INVALID_CONTENT_TYPE',
  'RESPONSE_TOO_LARGE',
]);

// Temporary compatibility endpoint. New clients use POST /api/product-preview so
// product URLs do not appear in query-string access logs.
export async function GET(request) {
  const guard = publicRequestGuard(request, { limit: 10, windowMs: 60_000 });
  if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

  const targetUrl = new URL(request.url).searchParams.get('url');
  try {
    const preview = await getProductPreview(targetUrl);
    const legacyProduct = {
      name: preview.fields.title,
      brand: preview.fields.brand,
      store: preview.sourceLabel,
      priceAed: preview.fields.priceAed,
      weight: null,
      category: preview.fields.categorySuggestion,
      imageUrl: preview.fields.imageUrl,
      sourceUrl: preview.canonicalUrl,
    };
    if (!legacyProduct.priceAed) {
      return NextResponse.json({ success: false, error: 'PRICE_NOT_FOUND', product: legacyProduct }, { status: 422 });
    }
    return NextResponse.json({ success: true, ...legacyProduct });
  } catch (error) {
    const code = error?.name === 'AbortError' ? 'UPSTREAM_TIMEOUT' : error?.message || 'PRODUCT_FETCH_FAILED';
    const isClientError = CLIENT_ERRORS.has(code);
    if (!isClientError) console.error('Legacy product preview failed:', code);
    return NextResponse.json({ success: false, error: isClientError ? code : 'PRODUCT_FETCH_FAILED' }, { status: isClientError ? 400 : 502 });
  }
}
