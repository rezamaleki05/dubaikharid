import { getProductCoverImage } from '../productGallery.js';
import { productPath } from '../productUrl.js';

export const TELEGRAM_PRODUCT_ORIGIN = 'https://www.dubaikharid.shop';
export function escapeTelegramHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
export function telegramExcerpt(value, limit) {
  const clean = String(value || '').replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  // Grapheme boundaries preserve Persian combining marks and emoji sequences.
  const segments = [...new Intl.Segmenter('fa', { granularity: 'grapheme' }).segment(clean)];
  let out = '';
  for (const { segment } of segments) {
    if (out.length + segment.length > limit - 1) return out + '…';
    out += segment;
  }
  return out;
}
export function buildTelegramProductPost(product) {
  const url = TELEGRAM_PRODUCT_ORIGIN + productPath(product.id);
  const summary = product.cardPricing;
  const price = summary?.minimumFinalPriceToman
    ? `${summary.varies ? 'از ' : ''}${BigInt(summary.minimumFinalPriceToman).toLocaleString('fa-IR')} تومان`
    : 'قیمت و موجودی در صفحه محصول';
  const lines = [
    `<b>${escapeTelegramHtml(telegramExcerpt(product.nameFa || product.name, 160))}</b>`,
    product.brand ? `برند: ${escapeTelegramHtml(telegramExcerpt(product.brand, 80))}` : '',
    price,
    product.supplyMode === 'IRAN_STOCK' ? 'موجود در ایران 🇮🇷' : 'خرید از دبی 🇦🇪',
    escapeTelegramHtml(telegramExcerpt(product.description, 360)),
    'مشاهده و خرید محصول 👇',
  ].filter(Boolean);
  let photo = null;
  const cover = getProductCoverImage(product);
  try {
    const image = new URL(cover, TELEGRAM_PRODUCT_ORIGIN);
    if (cover && image.protocol === 'https:' && !image.username && !image.password && !image.pathname.endsWith('.svg')) photo = image.href;
  } catch {}
  return { text: lines.join('\n\n'), photo, url, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: 'مشاهده محصول', url }]] } };
}
