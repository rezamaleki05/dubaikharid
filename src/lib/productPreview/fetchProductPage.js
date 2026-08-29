import { isSupportedProductStore, parseExternalHttpUrl } from '../externalUrlPolicy.js';

export const MAX_PRODUCT_HTML_BYTES = 2 * 1024 * 1024;
export const MAX_PRODUCT_REDIRECTS = 3;
export const PRODUCT_FETCH_TIMEOUT_MS = 6000;

function isHtmlContentType(value) {
  const contentType = String(value || '').split(';', 1)[0].trim().toLowerCase();
  return contentType === 'text/html' || contentType === 'application/xhtml+xml';
}

export async function readLimitedHtml(response, maximumBytes = MAX_PRODUCT_HTML_BYTES) {
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) throw new Error('RESPONSE_TOO_LARGE');
  if (!isHtmlContentType(response.headers.get('content-type'))) throw new Error('INVALID_CONTENT_TYPE');
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximumBytes) {
      await reader.cancel();
      throw new Error('RESPONSE_TOO_LARGE');
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

export async function fetchProductPage(initialUrl, {
  signal,
  fetchImpl = fetch,
  assertDestination,
} = {}) {
  let currentUrl = initialUrl instanceof URL ? initialUrl : parseExternalHttpUrl(initialUrl);
  if (!currentUrl) throw new Error('INVALID_URL');
  if (typeof assertDestination !== 'function') throw new TypeError('assertDestination is required.');

  for (let redirectCount = 0; redirectCount <= MAX_PRODUCT_REDIRECTS; redirectCount += 1) {
    await assertDestination(currentUrl);
    if (!isSupportedProductStore(currentUrl)) throw new Error('UNSUPPORTED_STORE');
    const response = await fetchImpl(currentUrl, {
      headers: {
        'User-Agent': 'DubaiKharid-ProductPreview/1.0 (+https://dubaikharid.shop)',
        Accept: 'text/html,application/xhtml+xml;q=0.9',
        'Accept-Language': 'en-AE,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'manual',
      signal,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirectCount === MAX_PRODUCT_REDIRECTS) throw new Error('INVALID_REDIRECT');
      const nextUrl = parseExternalHttpUrl(new URL(location, currentUrl).toString());
      if (!nextUrl) throw new Error('INVALID_REDIRECT');
      await response.body?.cancel();
      currentUrl = nextUrl;
      continue;
    }
    if (!response.ok) throw new Error(`UPSTREAM_${response.status}`);
    return { html: await readLimitedHtml(response), finalUrl: currentUrl };
  }
  throw new Error('TOO_MANY_REDIRECTS');
}
