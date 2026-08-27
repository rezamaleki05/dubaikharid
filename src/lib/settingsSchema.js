export const SETTING_DEFINITIONS = Object.freeze({
  siteName: { dbKey: 'siteName', type: 'text', max: 120, defaultValue: 'دبی خرید' },
  siteUrl: { dbKey: 'siteUrl', type: 'text', max: 240, defaultValue: 'dubaikharid.shop' },
  siteLogoUrl: { dbKey: 'siteLogoUrl', type: 'asset', max: 1_500_000, defaultValue: '/images/logo dubai kharid.png' },
  faviconUrl: { dbKey: 'faviconUrl', type: 'asset', max: 500_000, defaultValue: '/favicon.ico' },
  adminName: { dbKey: 'adminName', type: 'text', max: 120, defaultValue: 'مدیر سایت' },
  adminEmail: { dbKey: 'adminEmail', type: 'email', max: 320, defaultValue: 'admin@dubaykharid.ir' },
  adminPhone: { dbKey: 'adminPhone', type: 'phone', max: 40, defaultValue: '021-88001234' },
  timezone: { dbKey: 'timezone', type: 'enum', values: ['Asia/Tehran', 'Asia/Dubai', 'Europe/London', 'America/New_York'], defaultValue: 'Asia/Tehran' },
  supportPhone: { dbKey: 'supportPhone', type: 'phone', max: 40, defaultValue: '۰۹۱۷۶۱۶۸۳۸۱' },
  supportEmail: { dbKey: 'supportEmail', type: 'email', max: 320, defaultValue: 'support@dubaykharid.ir' },
  telegramId: { dbKey: 'telegramId', type: 'handle', max: 120, defaultValue: '@dubaykharid' },
  whatsapp: { dbKey: 'whatsapp', type: 'phone', max: 40, defaultValue: '+971501234567' },
  instagramId: { dbKey: 'instagramId', type: 'handle', max: 120, defaultValue: '@dubaykharid' },
  dubaiAddress: { dbKey: 'dubaiAddress', type: 'text', max: 500, defaultValue: 'امارات، دبی، بیزینس بی، ساختمان ۱۲ بی اسکور' },
  iranAddress: { dbKey: 'iranAddress', type: 'text', max: 500, defaultValue: 'شیراز، شهرک گلستان، خیابان گل آرا' },
  address: { dbKey: 'address', type: 'text', max: 500, defaultValue: 'دبی، امارات متحده عربی' },
  workingHours: { dbKey: 'workingHours', type: 'text', max: 240, defaultValue: 'شنبه تا پنجشنبه ۹ تا ۱۸' },
  minOrderAed: { dbKey: 'minOrderAed', type: 'number', min: 0, max: 1_000_000, defaultValue: '500' },
  commissionPercent: { dbKey: 'commissionPercent', type: 'number', min: 0, max: 100, defaultValue: '25', financial: true },
  shippingPerKgAed: { dbKey: 'shipping_cost_per_kg', type: 'number', min: 0, max: 1_000_000, defaultValue: '40', financial: true },
  minWeightClass: { dbKey: 'minWeightClass', type: 'number', min: 0.01, max: 1000, defaultValue: '1', financial: true },
  roundingMethod: { dbKey: 'roundingMethod', type: 'enum', values: ['ceil', 'floor', 'round'], defaultValue: 'ceil', financial: true },
  shippingBaseRate: { dbKey: 'shippingBaseRate', type: 'number', min: 0, max: 1_000_000_000_000, defaultValue: '1200000' },
  shippingPerKg: { dbKey: 'shippingPerKg', type: 'number', min: 0, max: 1_000_000_000_000, defaultValue: '350000' },
  freeShippingThreshold: { dbKey: 'freeShippingThreshold', type: 'number', min: 0, max: 1_000_000_000_000_000, defaultValue: '80000000' },
  maintenanceMode: { dbKey: 'maintenanceMode', type: 'boolean', defaultValue: false },
  allowRegistration: { dbKey: 'allowRegistration', type: 'boolean', defaultValue: true },
  autoNotify: { dbKey: 'autoNotify', type: 'boolean', defaultValue: true },
  notifyNewOrder: { dbKey: 'notifyNewOrder', type: 'boolean', defaultValue: true },
  notifyPayment: { dbKey: 'notifyPayment', type: 'boolean', defaultValue: true },
  notifyShipment: { dbKey: 'notifyShipment', type: 'boolean', defaultValue: true },
  cardPaymentEnabled: { dbKey: 'cardPaymentEnabled', type: 'boolean', defaultValue: true },
  onlinePaymentEnabled: { dbKey: 'onlinePaymentEnabled', type: 'boolean', defaultValue: false },
  aedRate: { dbKey: 'aed_toman_rate', type: 'number', min: 1, max: 100_000_000, defaultValue: '19500', financial: true },
  aedLastUpdate: { dbKey: 'aedLastUpdate', type: 'text', max: 120, defaultValue: 'ثبت نشده' },
  aedUpdateMode: { dbKey: 'aedUpdateMode', type: 'enum', values: ['manual'], defaultValue: 'manual' },
  aedAutoUpdate: { dbKey: 'aedAutoUpdate', type: 'boolean', defaultValue: false },
  aedUpdateInterval: { dbKey: 'aedUpdateInterval', type: 'enum', values: ['30min', '1hr', '3hr', 'daily'], defaultValue: '1hr' },
});

export const SETTING_KEYS = Object.freeze(Object.keys(SETTING_DEFINITIONS));

export const PUBLIC_SETTING_KEYS = Object.freeze([
  'siteName', 'siteUrl', 'siteLogoUrl', 'faviconUrl', 'supportPhone', 'supportEmail',
  'telegramId', 'whatsapp', 'instagramId', 'dubaiAddress', 'iranAddress', 'address',
  'workingHours', 'minOrderAed', 'commissionPercent', 'shippingPerKgAed',
  'minWeightClass', 'roundingMethod', 'maintenanceMode', 'allowRegistration',
  'cardPaymentEnabled', 'onlinePaymentEnabled', 'aedRate', 'aedLastUpdate',
]);

export const FINANCIAL_SETTING_KEYS = Object.freeze(
  SETTING_KEYS.filter(key => SETTING_DEFINITIONS[key].financial),
);

function asTrimmedString(value, maximum) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  if (!clean || clean.length > maximum) return null;
  return clean;
}

export function validateSettingValue(key, value) {
  const definition = SETTING_DEFINITIONS[key];
  if (!definition) return { error: 'کلید تنظیمات مجاز نیست.' };

  if (definition.type === 'boolean') {
    if (typeof value !== 'boolean') return { error: `مقدار ${key} باید منطقی باشد.` };
    return { value };
  }
  if (definition.type === 'number') {
    const numeric = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isFinite(numeric) || numeric < definition.min || numeric > definition.max) {
      return { error: `مقدار ${key} معتبر نیست.` };
    }
    return { value: String(numeric) };
  }
  if (definition.type === 'enum') {
    if (typeof value !== 'string' || !definition.values.includes(value)) {
      return { error: `مقدار ${key} مجاز نیست.` };
    }
    return { value };
  }

  const clean = asTrimmedString(value, definition.max);
  if (!clean) return { error: `مقدار ${key} معتبر نیست.` };
  if (definition.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { error: `ایمیل ${key} معتبر نیست.` };
  }
  if (definition.type === 'phone' && !/^[+\d\s()\-۰-۹٠-٩]{7,40}$/.test(clean)) {
    return { error: `شماره ${key} معتبر نیست.` };
  }
  if (definition.type === 'handle' && !/^@?[A-Za-z0-9._]{2,119}$/.test(clean)) {
    return { error: `مقدار ${key} معتبر نیست.` };
  }
  if (definition.type === 'asset') {
    const isPath = clean.startsWith('/') && !clean.startsWith('//');
    const isDataImage = /^data:image\/(?:png|jpeg|webp|gif|x-icon);base64,/i.test(clean);
    let isHttp = false;
    try {
      const parsed = new URL(clean);
      isHttp = ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password;
    } catch {}
    if (!isPath && !isDataImage && !isHttp) return { error: `مقدار ${key} معتبر نیست.` };
  }
  return { value: clean };
}

export function deserializeSettingValue(key, rawValue) {
  const definition = SETTING_DEFINITIONS[key];
  if (!definition) return undefined;
  if (definition.type === 'boolean') return rawValue === 'true';
  return rawValue;
}

export function serializeSettingValue(value) {
  return typeof value === 'boolean' ? String(value) : value;
}

export function defaultSettings(keys = SETTING_KEYS) {
  return Object.fromEntries(keys.map(key => [key, SETTING_DEFINITIONS[key].defaultValue]));
}
