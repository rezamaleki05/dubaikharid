import { normalizeSupportWhatsappNumber } from '../supportWhatsapp.js';

export const LEAD_SETTING_KEYS = Object.freeze([
  'telegramLeadsEnabled', 'telegramLeadChatId', 'whatsappLeadsEnabled',
  'whatsappLeadRecipient', 'whatsappLeadTemplate', 'whatsappLeadTemplateLanguage',
]);
export function normalizePrivateChatId(value) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  return /^[1-9]\d{0,15}$/.test(clean) && BigInt(clean) <= 4503599627370495n ? clean : null;
}
export function normalizeLeadRecipient(value) {
  return normalizeSupportWhatsappNumber(value);
}
export function leadConfiguration(settings, env) {
  const telegramConfigured = Boolean(env.TELEGRAM_BOT_TOKEN?.trim());
  const whatsappConfigured = Boolean(env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim()
    && /^[1-9]\d{4,30}$/.test(env.WHATSAPP_PHONE_NUMBER_ID || '')
    && /^v\d+\.\d+$/.test(env.WHATSAPP_GRAPH_API_VERSION || '')
    && /^[a-z0-9_]{1,100}$/.test(settings.whatsappLeadTemplate || '')
    && /^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(settings.whatsappLeadTemplateLanguage || ''));
  const chatId = normalizePrivateChatId(settings.telegramLeadChatId);
  const recipient = normalizeLeadRecipient(settings.whatsappLeadRecipient);
  // Preview/local never inherit an owner's destination. Unit tests inject mock transports.
  const production = env.VERCEL_ENV === 'production';
  return {
    telegram: { configured: telegramConfigured, chatId,
      code: !settings.telegramLeadsEnabled ? 'TELEGRAM_DISABLED'
        : !production || env.TELEGRAM_ALLOW_SEND !== 'true' ? 'TELEGRAM_ENVIRONMENT_BLOCKED'
          : !telegramConfigured ? 'TELEGRAM_NOT_CONFIGURED'
            : !chatId ? 'TELEGRAM_PRIVATE_CHAT_REQUIRED' : null },
    whatsapp: { configured: whatsappConfigured, configurationCode: whatsappConfigured ? null : 'WHATSAPP_NOT_CONFIGURED', recipient,
      template: settings.whatsappLeadTemplate || '', language: settings.whatsappLeadTemplateLanguage || '',
      code: !settings.whatsappLeadsEnabled ? 'WHATSAPP_DISABLED'
        : !whatsappConfigured ? 'WHATSAPP_NOT_CONFIGURED'
          : !production || env.WHATSAPP_ALLOW_SEND !== 'true' ? 'WHATSAPP_ENVIRONMENT_BLOCKED'
            : !recipient ? 'WHATSAPP_INVALID_RECIPIENT' : null },
  };
}

export const LEAD_ERRORS = Object.freeze({
  TELEGRAM_DISABLED: 'اعلان لید تلگرام غیرفعال است.',
  TELEGRAM_ENVIRONMENT_BLOCKED: 'ارسال تلگرام در این محیط مجاز نیست.',
  TELEGRAM_NOT_CONFIGURED: 'ربات در سرور تنظیم نشده است.',
  TELEGRAM_PRIVATE_CHAT_REQUIRED: 'شناسه عددی یک گفت‌وگوی شخصی لازم است؛ کانال و گروه مجاز نیست.',
  TELEGRAM_AUTH_FAILED: 'احراز هویت ربات ناموفق بود.',
  TELEGRAM_FORBIDDEN: 'مالک باید ابتدا ربات را باز کند و Start را بزند.',
  TELEGRAM_REJECTED: 'تلگرام درخواست را نپذیرفت.',
  TELEGRAM_RATE_LIMITED: 'محدودیت ارسال تلگرام اعمال شد.',
  TELEGRAM_UNAVAILABLE: 'تلگرام در دسترس نیست.',
  TELEGRAM_DELIVERY_UNCERTAIN: 'نتیجه ارسال تلگرام نامشخص است؛ پیش از ارسال مجدد مقصد را بررسی کنید.',
  WHATSAPP_DISABLED: 'اعلان لید واتساپ غیرفعال است.',
  WHATSAPP_NOT_CONFIGURED: 'اتصال سرور یا قالب تأییدشده واتساپ تنظیم نشده است.',
  WHATSAPP_ENVIRONMENT_BLOCKED: 'ارسال واتساپ در این محیط مجاز نیست.',
  WHATSAPP_INVALID_RECIPIENT: 'شماره مالک باید در قالب بین‌المللی باشد.',
  WHATSAPP_REJECTED: 'واتساپ درخواست را نپذیرفت؛ تنظیمات اتصال و قالب را بررسی کنید.',
  WHATSAPP_DELIVERY_UNCERTAIN: 'نتیجه ارسال واتساپ نامشخص است؛ پیش از ارسال مجدد مقصد را بررسی کنید.',
  LEAD_NOTIFICATION_UNAVAILABLE: 'اعلان مالک در دسترس نیست.',
});
export function safeLeadCode(error) {
  return Object.hasOwn(LEAD_ERRORS, error?.code) ? error.code : 'LEAD_NOTIFICATION_UNAVAILABLE';
}
