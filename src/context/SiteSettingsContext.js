'use client';

import { createContext, useContext, useState, useEffect } from 'react';

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
  commissionPercent: '25',
  shippingPerKgAed: '40',
  minWeightClass: '1',
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
  aedRate: '19500',
  aedLastUpdate: '1405/03/30 00:00',
  aedUpdateMode: 'manual',
  aedAutoUpdate: false,
  aedUpdateInterval: '1hr',
  googleClientId: '48558991372-4r4qd9m2kerqnnu9d9jbiru1q4cj96ee.apps.googleusercontent.com',
  googleAuthMode: 'simulated'
};

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dubaiKharidSiteSettings');
      if (saved) {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.error('Failed to load site settings:', e);
    }
    setLoaded(true);
  }, []);

  // Save to localStorage whenever settings change
  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    try {
      localStorage.setItem('dubaiKharidSiteSettings', JSON.stringify(merged));
    } catch (e) {
      console.error('Failed to save site settings:', e);
    }
    return merged;
  };

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

  // Function to execute rate update
  const updateAedRateAuto = async () => {
    const liveRate = await fetchLiveAedRate();
    const now = new Date();
    const jalaliDate = now.toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    
    if (liveRate) {
      const merged = updateSettings({
        aedRate: String(liveRate),
        aedLastUpdate: jalaliDate
      });
      return merged;
    }
    return null;
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

  // Set up auto-update interval
  useEffect(() => {
    if (!loaded || !settings.aedAutoUpdate) return;
    
    let intervalMinutes = 60;
    if (settings.aedUpdateInterval === '30min') intervalMinutes = 30;
    else if (settings.aedUpdateInterval === '1hr') intervalMinutes = 60;
    else if (settings.aedUpdateInterval === '3hr') intervalMinutes = 180;
    else if (settings.aedUpdateInterval === 'daily') intervalMinutes = 1440;
    
    // Initial fetch on setting activation
    updateAedRateAuto();
    
    const intervalId = setInterval(() => {
      updateAedRateAuto();
    }, intervalMinutes * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [settings.aedAutoUpdate, settings.aedUpdateInterval, loaded]);

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings, loaded, updateAedRateAuto }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

// Global price calculation helper
export function getProductTomanPrice(product, settings) {
  // Iran inventory warehouse products are already priced in Toman
  if (product.store === 'انبار ایران' || (product.id && product.id.startsWith('DK-INV')) || product.product_type === 'iran_inventory') {
    return product.price || 0;
  }
  
  // Laptops (electronics category starting with 'lap') are completely independent of exchange rate
  if (product.id && (product.id.startsWith('lap') || product.category === 'laptops')) {
    const fixedRate = 19500;
    if (product.rawSpecs?.sellingPrice) {
      return parseFloat(product.rawSpecs.sellingPrice);
    }
    return Math.round(product.priceAed * fixedRate);
  }
  
  // Standard products price calculation:
  // Formula: (قیمت محصول + هزینه ارسال + کارمزد) * نرخ درهم
  const rate = parseFloat(settings.aedRate) || 19500;
  const priceAed = parseFloat(product.priceAed) || 0;
  const weight = parseFloat(product.weight) || 1.0;
  
  // 1. Commission = productPrice * commissionPercent / 100
  const commissionPercent = parseFloat(settings.commissionPercent) || 25;
  const commissionAed = priceAed * (commissionPercent / 100);
  
  // 2. Shipping
  // Apply weight rounding rules dynamically based on settings
  const minWeight = parseFloat(settings.minWeightClass) || 1.0;
  const roundingMethod = settings.roundingMethod || 'ceil';
  
  let roundedWeight = weight;
  if (roundingMethod === 'ceil') {
    roundedWeight = Math.ceil(weight);
  } else if (roundingMethod === 'floor') {
    roundedWeight = Math.floor(weight);
  } else if (roundingMethod === 'round') {
    roundedWeight = Math.round(weight);
  }
  
  if (roundedWeight < minWeight) {
    roundedWeight = minWeight;
  }
  const shippingPerKgAed = parseFloat(settings.shippingPerKgAed) || 40;
  const shippingAed = roundedWeight * shippingPerKgAed;
  
  // Formula: (قیمت محصول + هزینه ارسال + کارمزد) * نرخ درهم
  const totalToman = (priceAed + shippingAed + commissionAed) * rate;
  return Math.round(totalToman);
}
