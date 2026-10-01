const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toLatinDigits(value) {
  return String(value ?? '').replace(/[۰-۹٠-٩]/g, digit => {
    const persian = PERSIAN_DIGITS.indexOf(digit);
    return String(persian >= 0 ? persian : ARABIC_DIGITS.indexOf(digit));
  });
}

export function isJalaliLeapYear(year) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  if (!Number.isInteger(year) || year < breaks[0] || year >= breaks.at(-1)) return false;
  const div = (a, b) => Math.trunc(a / b);
  const mod = (a, b) => a - Math.trunc(a / b) * b;
  let previous = breaks[0];
  let jump = 0;
  for (let index = 1; index < breaks.length; index += 1) {
    const next = breaks[index];
    jump = next - previous;
    if (year < next) break;
    previous = next;
  }
  let years = year - previous;
  if (jump - years < 6) years = years - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(years + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return leap === 0;
}

export function jalaliMonthLength(year, month) {
  if (month >= 1 && month <= 6) return 31;
  if (month >= 7 && month <= 11) return 30;
  if (month === 12) return isJalaliLeapYear(year) ? 30 : 29;
  return 0;
}

export function parseJalaliDate(value) {
  const normalizedDigits = toLatinDigits(value).trim().replace(/[.-]/g, '/');
  const match = normalizedDigits.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1200 || year > 1600 || month < 1 || month > 12 || day < 1 || day > jalaliMonthLength(year, month)) return null;
  return { year, month, day };
}

export function formatJalaliDate({ year, month, day }) {
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

export function normalizeJalaliDate(value) {
  const parsed = parseJalaliDate(value);
  return parsed ? formatJalaliDate(parsed) : null;
}

export function validateJalaliDate(value, { required = false } = {}) {
  if (!String(value ?? '').trim()) return required ? 'تاریخ ورود الزامی است.' : '';
  return normalizeJalaliDate(value) ? '' : 'تاریخ شمسی معتبر نیست؛ مثل ۱۴۰۵/۰۳/۲۰ وارد کنید.';
}

export function currentJalaliDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    timeZone: 'Asia/Dubai', year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}
