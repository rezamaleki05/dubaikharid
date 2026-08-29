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

export async function POST(request) {
  const guard = publicRequestGuard(request, { limit: 10, windowMs: 60_000 });
  if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

  let body;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => key !== 'url')) {
    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 });
  }

  try {
    return NextResponse.json(await getProductPreview(body.url));
  } catch (error) {
    const code = error?.name === 'AbortError' ? 'UPSTREAM_TIMEOUT' : error?.message || 'PRODUCT_FETCH_FAILED';
    const isClientError = CLIENT_ERRORS.has(code);
    if (!isClientError) console.error('Product preview failed:', code);
    return NextResponse.json({ success: false, error: isClientError ? code : 'PRODUCT_FETCH_FAILED' }, { status: isClientError ? 400 : 502 });
  }
}
