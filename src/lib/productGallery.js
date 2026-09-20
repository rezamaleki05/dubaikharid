export const MAX_PRODUCT_IMAGES = 10;

const PRODUCT_IMAGE_INPUT_FIELDS = new Set([
  'id', 'url', 'blobPathname', 'sortOrder', 'isPrimary', 'altFa', 'altEn',
]);

const PRODUCT_BLOB_PATHNAME = /^products\/\d{4}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i;

function cleanOptionalText(value, maximum) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim();
  if (!cleaned) return null;
  return cleaned.length <= maximum ? cleaned : undefined;
}

export function isOwnedProductBlobPathname(value) {
  return typeof value === 'string' && PRODUCT_BLOB_PATHNAME.test(value);
}

export function normalizeProductImageUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  const cleaned = value.trim();
  if (cleaned.startsWith('/') && !cleaned.startsWith('//')) return cleaned;
  try {
    const parsed = new URL(cleaned);
    return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export function normalizeProductImagesInput(value) {
  if (!Array.isArray(value) || value.length > MAX_PRODUCT_IMAGES) {
    return { error: `گالری محصول باید شامل حداکثر ${MAX_PRODUCT_IMAGES} تصویر باشد.` };
  }
  const images = [];
  const urls = new Set();
  const ids = new Set();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)
      || Object.keys(candidate).some(key => !PRODUCT_IMAGE_INPUT_FIELDS.has(key))) {
      return { error: 'ساختار تصویر گالری محصول معتبر نیست.' };
    }
    const url = normalizeProductImageUrl(candidate.url);
    if (!url) return { error: 'آدرس تصویر گالری محصول معتبر نیست.' };
    if (urls.has(url)) return { error: 'تصویر تکراری در گالری محصول مجاز نیست.' };
    urls.add(url);

    const id = cleanOptionalText(candidate.id, 128);
    if (id === undefined) return { error: 'شناسه تصویر گالری معتبر نیست.' };
    if (id && ids.has(id)) return { error: 'شناسه تصویر گالری تکراری است.' };
    if (id) ids.add(id);

    const blobPathname = cleanOptionalText(candidate.blobPathname, 512);
    if (blobPathname === undefined || (blobPathname && !isOwnedProductBlobPathname(blobPathname))) {
      return { error: 'مسیر ذخیره‌سازی تصویر محصول معتبر نیست.' };
    }
    if (blobPathname) {
      try {
        const pathname = decodeURIComponent(new URL(url).pathname).replace(/^\//, '');
        if (pathname !== blobPathname) return { error: 'مسیر فایل و آدرس تصویر محصول هم‌خوان نیستند.' };
      } catch {
        return { error: 'آدرس فایل ذخیره‌شده محصول معتبر نیست.' };
      }
    }
    const altFa = cleanOptionalText(candidate.altFa, 240);
    const altEn = cleanOptionalText(candidate.altEn, 240);
    if (altFa === undefined || altEn === undefined) {
      return { error: 'متن جایگزین تصویر حداکثر ۲۴۰ کاراکتر است.' };
    }
    if (Object.hasOwn(candidate, 'isPrimary') && typeof candidate.isPrimary !== 'boolean') {
      return { error: 'وضعیت تصویر اصلی معتبر نیست.' };
    }
    images.push({
      id,
      url,
      blobPathname,
      sortOrder: images.length,
      isPrimary: candidate.isPrimary === true,
      altFa,
      altEn,
    });
  }

  if (images.filter(image => image.isPrimary).length > 1) {
    return { error: 'فقط یک تصویر می‌تواند تصویر اصلی محصول باشد.' };
  }
  if (images.length && !images.some(image => image.isPrimary)) images[0].isPrimary = true;
  return { data: images };
}

export function serializeProductImages(product) {
  return [...(Array.isArray(product?.images) ? product.images : [])]
    .sort((left, right) => (
      Number(left.sortOrder || 0) - Number(right.sortOrder || 0)
      || String(left.id).localeCompare(String(right.id))
    ))
    .map(image => ({
      id: image.id,
      url: image.url,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
      altFa: image.altFa || null,
      altEn: image.altEn || null,
    }));
}

export function getProductPrimaryImage(product) {
  const images = serializeProductImages(product);
  return images.find(image => image.isPrimary) || images[0] || null;
}

export function getProductCoverImage(product, fallback = '') {
  return getProductPrimaryImage(product)?.url || product?.image || fallback;
}
