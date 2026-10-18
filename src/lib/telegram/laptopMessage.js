import { escapeTelegramHtml, telegramExcerpt } from './message.js';
import { laptopDisplayName } from '../laptopIdentity.js';
import { laptopPath, LAPTOP_ORIGIN } from '../laptopUrl.js';
import { publicImageList } from '../laptopSeoDomain.js';
export function buildTelegramLaptopPost(laptop) {
  const text = [
    `💻 ${laptopDisplayName(laptop)}`, laptopDisplayName(laptop, 'en'),
    laptop.cpu && `⚙️ ${laptop.cpu}`, laptop.ram && `🧠 RAM: ${laptop.ram}`,
    laptop.storage && `💾 ${laptop.storage}`, laptop.gpu && `🎮 ${laptop.gpu}`,
    [laptop.screen, laptop.displayResolution].filter(Boolean).length && `🖥 ${[laptop.screen, laptop.displayResolution].filter(Boolean).join(' — ')}`,
    laptop.isTouchscreen != null && `👆 صفحه لمسی: ${laptop.isTouchscreen ? 'دارد' : 'ندارد'}`,
    `💰 قیمت: ${BigInt(String(laptop.priceToman)).toLocaleString('fa-IR')} تومان`, '✅ موجود',
  ].filter(Boolean).map(value => escapeTelegramHtml(telegramExcerpt(String(value), 160))).join('\n');
  const url = LAPTOP_ORIGIN + laptopPath(laptop);
  const cover = publicImageList(laptop)[0];
  let photo = null;
  try { const parsed = new URL(cover); if(parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.pathname.endsWith('.svg')) photo = parsed.href; } catch {}
  return { text, photo, url, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: 'مشاهده لپ تاپ', url }]] } };
}
