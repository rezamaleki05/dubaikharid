export const TELEGRAM_SETTING_KEYS = ['telegramEnabled', 'telegramChannel', 'telegramAutoPublishProducts'];

export function normalizeTelegramChannel(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (/^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(text)) return text.toLowerCase();
  if (/^-[1-9]\d{4,15}$/.test(text)) return text;
  return null;
}

export function telegramEnvironmentAllowed(env) {
  if (env.TELEGRAM_ALLOW_SEND === 'false') return false;
  if (env.VERCEL_ENV === 'production') return true;
  // An override alone cannot target an inherited production channel.
  return env.TELEGRAM_ALLOW_SEND === 'true' && Boolean(normalizeTelegramChannel(env.TELEGRAM_TEST_CHANNEL));
}

export function telegramConfiguration(settings, env) {
  const production = env.VERCEL_ENV === 'production';
  const channel = normalizeTelegramChannel(production ? settings.telegramChannel : env.TELEGRAM_TEST_CHANNEL);
  const configured = Boolean(env.TELEGRAM_BOT_TOKEN?.trim());
  const code = !settings.telegramEnabled ? 'TELEGRAM_DISABLED'
    : !telegramEnvironmentAllowed(env) ? 'TELEGRAM_ENVIRONMENT_BLOCKED'
      : !configured ? 'TELEGRAM_NOT_CONFIGURED'
        : !channel ? 'TELEGRAM_INVALID_CHANNEL' : null;
  return { channel, configured, code, environmentAllowed: telegramEnvironmentAllowed(env), autoPublish: settings.telegramAutoPublishProducts === true };
}

export const TELEGRAM_ERRORS = Object.freeze({
  TELEGRAM_AUTO_PUBLISH_DISABLED: 'ارسال خودکار تلگرام غیرفعال است؛ ارسال دستی امکان‌پذیر است.',
  TELEGRAM_DISABLED: 'ارسال تلگرام غیرفعال است.',
  TELEGRAM_ENVIRONMENT_BLOCKED: 'ارسال در این محیط غیرفعال است؛ کانال آزمایشی جداگانه لازم است.',
  TELEGRAM_NOT_CONFIGURED: 'اتصال ربات در سرور تنظیم نشده است.',
  TELEGRAM_INVALID_CHANNEL: 'شناسه کانال معتبر نیست.',
  TELEGRAM_AUTH_FAILED: 'احراز هویت ربات ناموفق بود.',
  TELEGRAM_FORBIDDEN: 'ربات اجازه ارسال در کانال را ندارد.',
  TELEGRAM_REJECTED: 'تلگرام درخواست را نپذیرفت؛ کانال و محتوای محصول را بررسی کنید.',
  TELEGRAM_RATE_LIMITED: 'محدودیت ارسال تلگرام؛ پس از زمان مشخص‌شده دوباره تلاش کنید.',
  TELEGRAM_DELIVERY_UNCERTAIN: 'نتیجه ارسال نامشخص است. پیش از تلاش دوباره کانال را بررسی کنید؛ احتمال پست تکراری وجود دارد.',
  TELEGRAM_UNAVAILABLE: 'اتصال تلگرام برقرار نشد.',
  TELEGRAM_STORAGE_FAILED: 'ثبت نتیجه ارسال ناموفق بود؛ پیش از ارسال دوباره کانال را بررسی کنید.',
  PRODUCT_NOT_PUBLISHED: 'ابتدا محصول را در سایت منتشر کنید.',
  TELEGRAM_CONFIRM_REQUIRED: 'ارسال دوباره ممکن است پست تکراری ایجاد کند؛ تأیید صریح لازم است.',
  TELEGRAM_STALE_REQUEST: 'وضعیت ارسال تغییر کرده است؛ وضعیت را تازه‌سازی کنید.',
  TELEGRAM_DESTINATION_CHANGED: 'کانال مقصد تغییر کرده است؛ ارسال دستی لازم است.',
});
export class TelegramError extends Error {
  constructor(code, { retryAfter = null, uncertain = false } = {}) {
    super(TELEGRAM_ERRORS[code] || TELEGRAM_ERRORS.TELEGRAM_UNAVAILABLE);
    this.code = Object.hasOwn(TELEGRAM_ERRORS, code) ? code : 'TELEGRAM_UNAVAILABLE';
    this.retryAfter = retryAfter;
    this.uncertain = uncertain;
  }
}
export function safeTelegramError(error) {
  return error instanceof TelegramError ? error : new TelegramError('TELEGRAM_UNAVAILABLE');
}
