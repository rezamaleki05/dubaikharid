const options = { timeZone: 'Asia/Dubai', numberingSystem: 'arabext' };
const jalali = new Intl.DateTimeFormat('fa-IR', { ...options, calendar: 'persian', day: 'numeric', month: 'long', year: 'numeric' });
const gregorian = new Intl.DateTimeFormat('fa-IR', { ...options, calendar: 'gregory', day: 'numeric', month: 'long', year: 'numeric' });
const time = new Intl.DateTimeFormat('fa-IR', { ...options, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function dateText(formatter, date) {
  const parts = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
  return [parts.day, parts.month, parts.year].join(' ');
}
export function formatLeadTimestamp(value) {
  // Persisted events provide an ISO instant. Reject zone-less strings rather than assuming the host timezone.
  if (!(value instanceof Date) && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return ['شمسی: ' + dateText(jalali, date), 'میلادی: ' + dateText(gregorian, date), 'ساعت: ' + time.format(date) + ' دبی'].join('\n');
}
