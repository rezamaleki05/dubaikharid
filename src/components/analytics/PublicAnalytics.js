'use client';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { installAnalyticsRouteGuard, isPublicAnalyticsLocation, analyticsBrowserExcluded } from '@/lib/analyticsPolicy';
import { initializePublicAnalytics, flushAnalyticsEvents, trackEvent } from '@/lib/analytics';

export default function PublicAnalytics({ enabled, gaId }) {
  const pathname = usePathname();
  const [loadTag, setLoadTag] = useState(false);
  const lastPage = useRef(null);
  useEffect(() => installAnalyticsRouteGuard(window, { enabled, gaId, automated: analyticsBrowserExcluded(window) }), [enabled, gaId]);
  useEffect(() => {
    const allowed = enabled && isPublicAnalyticsLocation(window.location, { automated: analyticsBrowserExcluded(window) });
    window[`ga-disable-${gaId}`] = !allowed;
    window.__dkAnalyticsEnabled = Boolean(allowed);
    if (!allowed) { lastPage.current = null; flushAnalyticsEvents(); return; }
    if (!initializePublicAnalytics(gaId)) return;
    if (lastPage.current !== pathname) { trackEvent('page_view'); lastPage.current = pathname; }
    flushAnalyticsEvents();
    // Loading this script never changes visible UI or metadata.
    const timer = setTimeout(() => setLoadTag(true), 0);
    return () => clearTimeout(timer);
  }, [enabled, gaId, pathname]);
  if (!loadTag || !enabled || /^\/admin(?:\/|$)/.test(pathname)) return null;
  return <Script id="public-ga4" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />;
}
