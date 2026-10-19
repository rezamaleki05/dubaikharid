export const INDEXNOW_ORIGIN = 'https://dubaikharid.shop';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
export const INDEXNOW_STATIC_PATHS = Object.freeze([
  '/', '/buy-from-dubai', '/about', '/brands', '/stock-laptops', '/mobile',
  '/electronics', '/watches', '/sports-shoes', '/bags-accessories', '/beauty-health',
  '/clothing', '/women', '/men', '/kids', '/other-products', '/sale', '/best-sellers',
]);
export function indexNowConfiguration(env = process.env) {
  const key = env.INDEXNOW_KEY || '';
  if (env.VERCEL_ENV !== 'production' || env.NEXT_PUBLIC_SITE_URL !== INDEXNOW_ORIGIN || !/^[a-fA-F0-9]{8,128}$/.test(key)) return null;
  return { host: 'dubaikharid.shop', key, keyLocation: `${INDEXNOW_ORIGIN}/indexnow.txt` };
}
export function canonicalIndexNowUrl(input) {
  if (typeof input !== 'string' || input.trim() !== input || !input.startsWith(`${INDEXNOW_ORIGIN}/`)) return null;
  try {
    const url = new URL(input);
    if (url.origin !== INDEXNOW_ORIGIN || url.username || url.password || url.port || url.search || url.hash) return null;
    if (url.pathname !== input.slice(INDEXNOW_ORIGIN.length)) return null;
    if (INDEXNOW_STATIC_PATHS.includes(url.pathname)) return url.href;
    const match = /^\/(product|laptops|stores|brands|guides)\/([^/]+)$/.exec(url.pathname);
    if (!match || !/^[\p{L}\p{N}_-]{1,180}$/u.test(decodeURIComponent(match[2]))) return null;
    // Reject normalization tricks, encoded separators and dot segments.
    if (new URL(input).pathname !== input.slice(INDEXNOW_ORIGIN.length)) return null;
    return url.href;
  } catch { return null; }
}
export function stablePublicContent(value) {
  if (Array.isArray(value)) return value.map(stablePublicContent);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort()
    .filter(key => !['updatedAt', 'createdAt', 'previousModelSlugs'].includes(key))
    .map(key => [key, stablePublicContent(value[key])]));
  return typeof value === 'bigint' ? value.toString() : value;
}
export function changedPublicUrls(before = {}, after = {}) {
  return Object.keys(after).filter(url => canonicalIndexNowUrl(url)
    && JSON.stringify(stablePublicContent(before[url])) !== JSON.stringify(stablePublicContent(after[url])));
}
export function indexNowKeyResponse(url, filename, env = process.env) {
  const configuration = indexNowConfiguration(env);
  if (!configuration || new URL(url).origin !== INDEXNOW_ORIGIN || filename !== 'indexnow.txt') return new Response('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
  return new Response(configuration.key, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' } });
}
export function createIndexNowClient({ env = process.env, fetchImpl = fetch, now = Date.now, timeoutMs = 5000, logger = console } = {}) {
  const sent = new Map(), pending = new Set();
  return { async submit(input) {
    const configuration = indexNowConfiguration(env);
    if (!configuration) return { ok: false, skipped: true, code: 'DISABLED' };
    if (!Array.isArray(input) || input.length > 500 || input.some(url => !canonicalIndexNowUrl(url))) return { ok: false, code: 'INVALID_URLS' };
    const tick = now();
    for (const [url, time] of sent) if (tick - time >= 300000) sent.delete(url);
    const urls = [...new Set(input.map(canonicalIndexNowUrl))].filter(url => !pending.has(url) && !sent.has(url));
    if (!urls.length) return { ok: true, skipped: true, count: 0, code: 'NO_NEW_URLS' };
    urls.forEach(url => pending.add(url));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(INDEXNOW_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ ...configuration, urlList: urls }), signal: controller.signal, redirect: 'error' });
      const ok = response.status === 200 || response.status === 202;
      if (ok) for (const url of urls) { sent.delete(url); sent.set(url, now()); }
      while (sent.size > 500) sent.delete(sent.keys().next().value);
      if (!ok) logger.warn('INDEXNOW_NOT_ACCEPTED', { status: response.status, count: urls.length });
      return { ok, status: response.status, count: urls.length, code: ok ? (response.status === 202 ? 'KEY_VALIDATION_PENDING' : 'ACCEPTED') : 'NOT_ACCEPTED' };
    } catch {
      logger.warn('INDEXNOW_UNAVAILABLE', { count: urls.length });
      return { ok: false, count: urls.length, code: 'UNAVAILABLE' };
    } finally { clearTimeout(timer); urls.forEach(url => pending.delete(url)); }
  } };
}
// Both scheduling and delivery failures are isolated from the original publish response.
export function scheduleIndexNowComparison({ before, readAfter, submit, defer, logger = console }) {
  if (!before) return;
  try {
    defer(async () => {
      try { const next = await readAfter(); await submit(changedPublicUrls(before.pages, next.pages)); }
      catch { logger.warn('INDEXNOW_CHANGE_DEFERRED'); }
    });
  } catch { logger.warn('INDEXNOW_CHANGE_DEFERRED'); }
}
