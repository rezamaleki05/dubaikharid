// Independent of GA4: only known public apex pages may enter session recording.
const PUBLIC_PATHS = new Set(['/', '/about', '/buy-from-dubai', '/brands', '/search',
  '/stock-laptops', '/mobile', '/electronics', '/watches', '/sports-shoes',
  '/bags-accessories', '/beauty-health', '/clothing', '/women', '/men', '/kids',
  '/other-products', '/sale', '/best-sellers']);
export const CLARITY_DOCUMENT_KEY = '__dkPublicClarity';
export function clarityProjectId(value) {
  return typeof value === 'string' && /^[a-z0-9]{6,32}$/.test(value) ? value : null;
}
export function isClarityEnvironment(env) {
  return env.VERCEL_ENV === 'production' && env.NODE_ENV === 'production'
    && env.NEXT_PUBLIC_SITE_URL === 'https://dubaikharid.shop'
    && Boolean(clarityProjectId(env.NEXT_PUBLIC_CLARITY_PROJECT_ID));
}
export function isClarityLocation(location) {
  if (!location || location.origin !== 'https://dubaikharid.shop' || location.username || location.password
    || location.search || (location.hash && !(location.pathname === '/' && location.hash === '#calculator'))) return false;
  if (PUBLIC_PATHS.has(location.pathname)) return true;
  return /^\/(?:product|laptops|stores|brands|guides)\/[a-zA-Z0-9_-]{1,180}$/.test(location.pathname);
}
export function clarityPageType(path) {
  if (path === '/') return 'home';
  if (path === '/buy-from-dubai') return 'buy_from_dubai';
  if (path === '/search') return 'search';
  for (const [prefix, type] of [['/product/', 'product'], ['/laptops/', 'laptop'], ['/stores/', 'store'], ['/brands/', 'brand'], ['/guides/', 'guide']]) {
    if (path.startsWith(prefix)) return type;
  }
  return 'public';
}
export function clarityBrowserExcluded(win) {
  if (win.navigator?.webdriver || win.__DUBAIKHARID_QA__) return true;
  try {
    if (win.localStorage?.getItem('dubaikharid_analytics_opt_out') === '1'
      || win.localStorage?.getItem('dubaikharid_clarity_opt_out') === '1') return true;
  } catch { return true; }
  // Clarity also observes referrers. Never initialize with a sensitive URL there.
  if (win.document.referrer) {
    try {
      const referrer = new URL(win.document.referrer);
      if (referrer.search || referrer.hash || (referrer.origin === 'https://dubaikharid.shop' && !isClarityLocation(referrer))) return true;
    } catch { return true; }
  }
  return false;
}
