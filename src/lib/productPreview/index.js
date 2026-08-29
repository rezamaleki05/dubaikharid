import 'server-only';

import { assertPublicDestination, isSupportedProductStore, parseExternalHttpUrl } from '@/lib/externalUrls';
import { fetchProductPage, PRODUCT_FETCH_TIMEOUT_MS } from './fetchProductPage.js';
import { normalizePreviewImageUrl } from './imageUrl.js';
import { parseProductHtml } from './parser.js';

async function validateImageUrl(value, pageUrl) {
  const parsedValue = normalizePreviewImageUrl(value, pageUrl);
  const parsed = parsedValue ? parseExternalHttpUrl(parsedValue) : null;
  if (!parsed) return null;
  try {
    await assertPublicDestination(parsed);
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function getProductPreview(value) {
  const url = parseExternalHttpUrl(value);
  if (!url) throw new Error('INVALID_URL');
  if (!isSupportedProductStore(url)) throw new Error('UNSUPPORTED_STORE');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PRODUCT_FETCH_TIMEOUT_MS);
  try {
    const { html, finalUrl } = await fetchProductPage(url, { signal: controller.signal, assertDestination: assertPublicDestination });
    const preview = parseProductHtml(html, finalUrl);
    preview.fields.imageUrl = await validateImageUrl(preview.fields.imageUrl, finalUrl);
    preview.confidence.imageUrl = preview.fields.imageUrl ? preview.confidence.imageUrl : null;
    return {
      success: true,
      source: preview.source,
      sourceLabel: preview.sourceLabel,
      canonicalUrl: finalUrl.toString(),
      fields: preview.fields,
      confidence: preview.confidence,
      warnings: preview.warnings,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
