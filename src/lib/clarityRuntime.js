import { CLARITY_DOCUMENT_KEY, clarityBrowserExcluded, clarityPageType, clarityProjectId, isClarityLocation } from './clarityPolicy.js';

// A document-scoped singleton survives React remounts without duplicating the SDK.
// Private navigation crosses a full document boundary; an SDK is never restarted
// in a document after it has been stopped for privacy.
export function installPublicClarity(win, { enabled, projectId }) {
  if (!enabled || !clarityProjectId(projectId) || clarityBrowserExcluded(win)) return null;
  if (win[CLARITY_DOCUMENT_KEY]) return win[CLARITY_DOCUMENT_KEY];
  // Do not take ownership of an unexpected pre-existing integration.
  if (win.clarity || win.document.querySelector('script[src*="clarity.ms/"]')) return null;
  const state = { scheduled: false, initialized: false, stopped: false, script: null };
  win[CLARITY_DOCUMENT_KEY] = state;
  let cancelIdle = () => {};
  let lastType;
  const allowed = url => isClarityLocation(url) && !clarityBrowserExcluded(win);
  const stop = () => {
    if (!state.scheduled && !state.initialized) return;
    state.stopped = true;
    cancelIdle();
    // The queue also carries stop if the network script has not loaded yet.
    win.clarity?.('stop');
    state.script?.remove();
  };
  const tag = url => {
    const type = clarityPageType(url.pathname);
    if (lastType !== type) { win.clarity?.('set', 'page_type', type); lastType = type; }
  };
  const initialize = () => {
    if (state.stopped || state.initialized || !allowed(new URL(win.location.href))
      || win.document.querySelector('[data-dk-clarity-sensitive]')) return;
    // Mask before the first SDK observation, including signed-in Header text,
    // portal dialogs, free-text echoes and asynchronously rendered content.
    win.document.body.setAttribute('data-clarity-mask', 'true');
    win.clarity = function () { (win.clarity.q = win.clarity.q || []).push(arguments); };
    // No consent is invented and no Clarity cookies are requested. This does
    // not modify GA4 consent/configuration or cross-link the two products.
    win.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
    tag(new URL(win.location.href));
    const script = win.document.createElement('script');
    script.id = 'dk-public-clarity';
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${projectId}`;
    script.referrerPolicy = 'no-referrer';
    script.onerror = stop;
    state.script = script;
    state.initialized = true;
    win.document.head.appendChild(script);
  };
  const sync = () => {
    if (!allowed(new URL(win.location.href))) { stop(); return; }
    if (state.stopped) return;
    if (state.initialized) { tag(new URL(win.location.href)); return; }
    if (state.scheduled) return;
    state.scheduled = true;
    // Hydration and critical navigation/image work take precedence.
    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(initialize, { timeout: 2500 });
      cancelIdle = () => win.cancelIdleCallback(id);
    } else {
      const id = win.setTimeout(initialize, 1500);
      cancelIdle = () => win.clearTimeout(id);
    }
  };
  const crossBoundary = url => {
    stop();
    win.location.assign(url.href);
  };
  for (const name of ['pushState', 'replaceState']) {
    const original = win.history[name];
    win.history[name] = function (data, unused, value) {
      const url = new URL(value == null ? win.location.href : value, win.location.href);
      if (url.origin !== win.location.origin) return original.apply(this, arguments);
      if ((state.scheduled || state.initialized) && !allowed(url)) { crossBoundary(url); return; }
      const result = original.apply(this, arguments);
      sync();
      return result;
    };
  }
  win.document.addEventListener('click', event => {
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor) return;
    const url = new URL(anchor.href, win.location.href);
    // Clicked URLs are a separate Clarity data surface, even in masked text.
    // Stop before the SDK sees private/query/external destinations or new tabs.
    if (!allowed(url)) stop();
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || (event.button !== undefined && event.button !== 0) || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;
    if (url.origin === win.location.origin && !allowed(url) && (state.scheduled || state.initialized)) {
      event.preventDefault(); event.stopImmediatePropagation(); crossBoundary(url);
    }
  }, true);
  const onNavigation = () => {
    if ((state.scheduled || state.initialized) && !allowed(new URL(win.location.href))) {
      stop(); win.location.reload(); return;
    }
    sync();
  };
  win.addEventListener('popstate', onNavigation, true);
  win.addEventListener('pageshow', onNavigation, true);
  // Registered before the SDK: stop before it observes customer-entered URL
  // attributes or payment details in newly opened request/checkout dialogs.
  if (win.MutationObserver) {
    const observer = new win.MutationObserver(() => {
      if (win.document.querySelector('[data-dk-clarity-sensitive]')) { stop(); observer.disconnect(); }
    });
    observer.observe(win.document.body, { childList: true, subtree: true });
    state.privacyObserver = observer;
  }
  sync();
  return state;
}
