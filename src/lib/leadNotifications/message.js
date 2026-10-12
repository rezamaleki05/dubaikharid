const TYPES = { purchase_request: 'درخواست قیمت / خرید محصول', order: 'سفارش جدید', contact: 'درخواست تماس', test: 'آزمایش اعلان مالک' };
function clean(value, max = 400) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}
export function escapeLeadHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function boundedHtml(value, maximum) {
  let text = '';
  for (const character of value) {
    const escaped = escapeLeadHtml(character);
    if (text.length + escaped.length > maximum - 1) return text + '…';
    text += escaped;
  }
  return text;
}
function safeUrl(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password && u.href.length <= 600 ? u.href : ''; } catch { return ''; }
}
export function leadFields(event) {
  return [
    ['نوع', TYPES[event.type] || 'درخواست جدید'], ['نام', clean(event.customerName, 160)],
    ['شماره', clean(event.phone, 40)], ['ایمیل', clean(event.email, 320)],
    ['محصول / اقلام', clean(event.product, 500)], ['شماره سفارش', clean(event.orderId, 100)],
    ['مبلغ (تومان)', clean(event.estimatedAmount, 80)], ['قیمت مبدا (درهم)', clean(event.amountAed, 80)], ['پیام', clean(event.message, 700)],
    ['منبع', clean(event.source, 160)], ['زمان', clean(event.createdAt, 80)],
  ];
}
export function buildLeadTelegramMessage(event) {
  const limits = [100, 160, 40, 320, 500, 100, 80, 80, 650, 160, 80];
  const lines = ['🔔 <b>لید جدید دبی‌خرید</b>', ...leadFields(event).map(([k,v], i) => v ? `<b>${k}:</b> ${boundedHtml(v, limits[i])}` : '').filter(Boolean)];
  const productUrl = safeUrl(event.productUrl), adminUrl = safeUrl(event.adminUrl);
  if (productUrl && escapeLeadHtml(productUrl).length <= 600) lines.push(`<a href="${escapeLeadHtml(productUrl)}">مشاهده محصول</a>`);
  if (adminUrl && escapeLeadHtml(adminUrl).length <= 600) lines.push(`<a href="${escapeLeadHtml(adminUrl)}">پیگیری در مدیریت</a>`);
  return { text: lines.join('\n\n'), parse_mode: 'HTML', link_preview_options: { is_disabled: true } };
}
// Approved template body must have exactly these eight positional text parameters.
export function buildLeadWhatsappParameters(event) {
  const fields = Object.fromEntries(leadFields(event));
  return [fields['نوع'], fields['نام'], [fields['شماره'], fields['ایمیل']].filter(Boolean).join(' / '),
    [fields['شماره سفارش'], fields['محصول / اقلام']].filter(Boolean).join(' — '), [fields['مبلغ (تومان)'] && `${fields['مبلغ (تومان)']} تومان`, fields['قیمت مبدا (درهم)'] && `${fields['قیمت مبدا (درهم)']} درهم`].filter(Boolean).join(' / '),
    fields['پیام'], [fields['منبع'], safeUrl(event.adminUrl) || safeUrl(event.productUrl)].filter(Boolean).join(' — '), fields['زمان']]
    .map(value => ({ type: 'text', text: clean(value, 500) || '—' }));
}
