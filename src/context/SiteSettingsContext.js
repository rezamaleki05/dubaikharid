'use client';

import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { calculateProductPricing } from '@/lib/pricing';

const SiteSettingsContext = createContext();

const DEFAULTS = {
  siteName: 'دبی خرید',
  siteUrl: 'dubaykharid.ir',
  siteLogoUrl: '/images/logo dubai kharid.png',
  faviconUrl: '/favicon.ico',
  adminName: 'مدیر سایت',
  adminEmail: 'admin@dubaykharid.ir',
  adminPhone: '021-88001234',
  timezone: 'Asia/Tehran',
  supportPhone: '۰۹۱۷۶۱۶۸۳۸۱',
  supportEmail: 'support@dubaykharid.ir',
  telegramId: '@dubaykharid',
  whatsapp: '+971501234567',
  instagramId: '@dubaykharid',
  dubaiAddress: 'امارات، دبی، بیزینس بی، ساختمان ۱۲ بی اسکور',
  iranAddress: 'شیراز، شهرک گلستان، خیابان گل آرا',
  address: 'دبی، امارات متحده عربی',
  workingHours: 'شنبه تا پنجشنبه ۹ تا ۱۸',
  minOrderAed: '500',
  commissionPercent: '',
  shippingPerKgAed: '',
  minWeightClass: '',
  roundingMethod: 'ceil',
  shippingBaseRate: '1200000',
  shippingPerKg: '350000',
  freeShippingThreshold: '80000000',
  maintenanceMode: false,
  allowRegistration: true,
  autoNotify: true,
  notifyNewOrder: true,
  notifyPayment: true,
  notifyShipment: true,
  aedRate: '',
  aedLastUpdate: '1405/03/30 00:00',
  aedUpdateMode: 'manual',
  aedAutoUpdate: false,
  aedUpdateInterval: '1hr',
  googleClientId: '48558991372-4r4qd9m2kerqnnu9d9jbiru1q4cj96ee.apps.googleusercontent.com',
  googleAuthMode: 'simulated'
};

export function SiteSettingsProvider({ children, initialSettings = null }) {
  const [settings, setSettings] = useState({ ...DEFAULTS, ...(initialSettings || {}) });
  const [loaded, setLoaded] = useState(true);

  const refreshSettings = async () => {
    try {
      const response = await fetch('/api/settings/public', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load settings.');
      setSettings(previous => ({ ...previous, ...payload.data }));
      return payload.data;
    } catch (error) {
      console.error('Failed to load site settings:', error);
      return null;
    } finally {
      setLoaded(true);
    }
  };

  // Context mirrors server state for client consumers; persistence is handled by protected APIs.
  const updateSettings = useCallback((newSettings) => {
    setSettings(previous => ({ ...previous, ...newSettings }));
  }, []);

  // Helper to fetch live rate from local API proxy
  const fetchLiveAedRate = async () => {
    try {
      const res = await fetch('/api/fetch-aed-rate');
      const data = await res.json();
      if (data && data.rate) {
        return data.rate;
      }
    } catch (e) {
      console.error('Failed to fetch rate from API proxy:', e);
    }
    return null;
  };

  // Manual lookup only. The admin Settings API decides whether a returned rate is persisted.
  const updateAedRateAuto = async () => {
    const liveRate = await fetchLiveAedRate();
    const now = new Date();
    const jalaliDate = now.toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    return liveRate ? { aedRate: String(liveRate), aedLastUpdate: jalaliDate } : null;
  };

  // Apply site name dynamically to document title
  useEffect(() => {
    if (!loaded || !settings.siteName) return;
    try {
      if (document.title) {
        const defaultSuffix = 'خرید مستقیم از فروشگاه‌های بین‌المللی دبی';
        document.title = `${settings.siteName} | ${defaultSuffix}`;
      }
    } catch (e) {}
  }, [settings.siteName, loaded]);

  // Apply favicon dynamically when faviconUrl changes
  useEffect(() => {
    if (!loaded || !settings.faviconUrl) return;
    try {
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.faviconUrl;
    } catch (e) {}
  }, [settings.faviconUrl, loaded]);

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings, refreshSettings, loaded, updateAedRateAuto }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

// Global price calculation helper
export function getProductTomanPrice(product, settings) {
  if (product?.priceToman !== null && product?.priceToman !== undefined) {
    return Number(product.priceToman) || 0;
  }
  // Iran inventory warehouse products are already priced in Toman
  if (product.store === 'انبار ایران' || (product.id && product.id.startsWith('DK-INV')) || product.product_type === 'iran_inventory') {
    const inventoryPrice = Number(product.price);
    if (Number.isFinite(inventoryPrice) && inventoryPrice > 0) return inventoryPrice;
  }
  
  // A stored selling price is already an authoritative Toman snapshot.
  if (product.id && (product.id.startsWith('lap') || product.category === 'laptops')) {
    if (product.rawSpecs?.sellingPrice) {
      return parseFloat(product.rawSpecs.sellingPrice);
    }
  }

  try {
    return calculateProductPricing({
      priceAed: parseFloat(product.priceAed) || 0,
      weight: parseFloat(product.weight) || Number(settings.minWeightClass),
    }, settings).totalToman;
  } catch {
    return 0;
  }
}
