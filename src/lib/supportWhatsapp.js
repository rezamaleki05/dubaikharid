export const DEFAULT_SUPPORT_WHATSAPP = '+971527556964';

function toAsciiDigits(value) {
  return value
    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632));
}

export function normalizeSupportWhatsappNumber(value) {
  if (typeof value !== 'string') return null;

  const input = toAsciiDigits(value.trim());
  if (!input || !/^\+?[\d\s().-]+$/.test(input)) return null;

  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;

  return `+${digits}`;
}

export function resolveSupportWhatsappNumber(value) {
  return normalizeSupportWhatsappNumber(value) || DEFAULT_SUPPORT_WHATSAPP;
}

export function buildSupportWhatsappUrl(value) {
  return `https://wa.me/${resolveSupportWhatsappNumber(value).slice(1)}`;
}
