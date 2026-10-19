export const ANALYTICS_HOSTS = new Set(['dubaikharid.shop', 'www.dubaikharid.shop']);
export function isPublicAnalyticsLocation(location, { automated = false } = {}) {
  if (!location || automated || location.protocol !== 'https:' || !ANALYTICS_HOSTS.has(location.hostname)) return false;
  return !/^\/(?:admin|api)(?:\/|$)/.test(location.pathname);
}
export function analyticsBrowserExcluded(win) {
  if (win.navigator?.webdriver || win.__DUBAIKHARID_QA__) return true;
  try { return win.localStorage?.getItem('dubaikharid_analytics_opt_out') === '1'; } catch { return false; }
}
export function analyticsPageContext(location) {
  const path = location.pathname;
  const pageType = path === '/' ? 'home' : path.startsWith('/product/') ? 'product' : path.startsWith('/laptops/') ? 'laptop' : path.startsWith('/guides/') ? 'guide' : path.startsWith('/stores/') ? 'store' : path.startsWith('/brands/') ? 'brand' : 'public';
  return { page_path: path, page_type: pageType };
}

// Install before loading gtag. History is gated before Google's SPA listeners run.
export function installAnalyticsRouteGuard(win, { enabled, gaId, automated = false }) {
  const sync = (url = win.location.href) => {
    const location = new URL(url, win.location.href);
    const allowed = enabled && isPublicAnalyticsLocation(location, { automated });
    win[`ga-disable-${gaId}`] = !allowed;
    win.__dkAnalyticsEnabled = Boolean(allowed);
    if (allowed) win.gtag?.('set', { page_location: location.origin + location.pathname, page_title: `DubaiKharid | ${analyticsPageContext(location).page_type}` });
    return allowed;
  };
  const originals = {};
  for (const name of ['pushState', 'replaceState']) {
    originals[name] = win.history[name];
    win.history[name] = function (state, unused, url) {
      sync(url == null ? win.location.href : url);
      return originals[name].apply(this, arguments);
    };
  }
  const onRoute = () => sync();
  const onClick = event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event.button !== undefined && event.button !== 0)) return;
    const anchor = event.target?.closest?.('a[href]');
    if (anchor?.target === '_blank' || anchor?.hasAttribute?.('download')) return;
    if (anchor) { const url = new URL(anchor.href, win.location.href); if (url.origin === win.location.origin && /^\/admin(?:\/|$)/.test(url.pathname)) sync(url.href); }
  };
  win.addEventListener('popstate', onRoute);
  win.addEventListener('pageshow', onRoute);
  win.document.addEventListener('click', onClick, true);
  sync();
  return () => {
    for (const name of Object.keys(originals)) win.history[name] = originals[name];
    win.removeEventListener('popstate', onRoute); win.removeEventListener('pageshow', onRoute);
    win.document.removeEventListener('click', onClick, true);
  };
}
