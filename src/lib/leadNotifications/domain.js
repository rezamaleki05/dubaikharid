import { TELEGRAM_ERRORS } from '../telegram/domain.js';
export const LEAD_SETTING_KEYS = Object.freeze(['telegramLeadEnabled', 'telegramLeadChatId']);
export function normalizeLeadGroupId(value) {
  if (typeof value !== 'string') return null;
  const id = value.trim();
  return /^-[1-9]\d{0,15}$/.test(id) && BigInt(id) >= -4503599627370495n ? id : null;
}
export function leadConfiguration(settings, env) {
  const configured = Boolean(env.TELEGRAM_BOT_TOKEN?.trim());
  const chatId = normalizeLeadGroupId(settings.telegramLeadChatId);
  const environmentAllowed = env.VERCEL_ENV === 'production' && env.TELEGRAM_ALLOW_SEND === 'true';
  const code = !settings.telegramLeadEnabled ? 'TELEGRAM_LEAD_DISABLED'
    : !environmentAllowed ? 'TELEGRAM_ENVIRONMENT_BLOCKED'
      : !configured ? 'TELEGRAM_NOT_CONFIGURED' : !chatId ? 'TELEGRAM_PRIVATE_GROUP_REQUIRED' : null;
  return { configured, chatId, environmentAllowed, code };
}
export const LEAD_ERRORS = Object.freeze({ ...TELEGRAM_ERRORS,
  TELEGRAM_LEAD_DISABLED: 'اعلان لیدها غیرفعال است.',
  TELEGRAM_ENVIRONMENT_BLOCKED: 'ارسال لید تلگرام در این محیط غیرفعال است.',
  TELEGRAM_PRIVATE_GROUP_REQUIRED: 'فقط شناسه عددی منفی یک گروه خصوصی مجاز است؛ کانال، گروه عمومی و حساب شخصی مجاز نیست.',
  TELEGRAM_FORBIDDEN: 'ربات باید عضو گروه خصوصی باشد و اجازه ارسال پیام داشته باشد.',
  TELEGRAM_REJECTED: 'تلگرام درخواست اعلان لید را نپذیرفت.',
  TELEGRAM_DELIVERY_UNCERTAIN: 'نتیجه ارسال نامشخص است؛ پیش از تکرار، گروه را بررسی کنید.',
  LEAD_NOTIFICATION_UNAVAILABLE: 'اعلان لید در دسترس نیست.',
});
export function safeLeadCode(error) { return Object.hasOwn(LEAD_ERRORS, error?.code) ? error.code : 'LEAD_NOTIFICATION_UNAVAILABLE'; }
