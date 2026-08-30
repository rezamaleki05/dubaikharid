export const MAX_WAREHOUSE_IMAGES = 12;

const GALLERY_IMAGE_FIELDS = new Set(['url', 'isPrimary']);

function validateGalleryImageUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return undefined;
  const cleaned = value.trim();
  if (cleaned.startsWith('/') && !cleaned.startsWith('//')) return cleaned;
  try {
    const parsed = new URL(cleaned);
    return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function validateWarehouseImages(value) {
  if (!Array.isArray(value) || value.length > MAX_WAREHOUSE_IMAGES) {
    return { error: `گالری باید شامل حداکثر ${MAX_WAREHOUSE_IMAGES} تصویر باشد.` };
  }
  const images = [];
  const seen = new Set();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)
      || Object.keys(candidate).some(key => !GALLERY_IMAGE_FIELDS.has(key))) {
      return { error: 'ساختار تصویر گالری معتبر نیست.' };
    }
    const url = validateGalleryImageUrl(candidate.url);
    if (!url) return { error: 'آدرس تصویر گالری معتبر نیست.' };
    if (Object.hasOwn(candidate, 'isPrimary') && typeof candidate.isPrimary !== 'boolean') {
      return { error: 'وضعیت تصویر اصلی معتبر نیست.' };
    }
    if (seen.has(url)) continue;
    seen.add(url);
    images.push({ url, isPrimary: candidate.isPrimary === true });
  }
  if (images.filter(image => image.isPrimary).length > 1) {
    return { error: 'فقط یک تصویر می‌تواند تصویر اصلی باشد.' };
  }
  if (images.length && !images.some(image => image.isPrimary)) images[0].isPrimary = true;
  return { value: images.map((image, sortOrder) => ({ ...image, sortOrder })) };
}

export function serializeWarehouseImages(item) {
  const normalized = Array.isArray(item.images) ? item.images.map(image => ({
    id: image.id,
    url: image.url,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
  })) : [];
  return normalized.length
    ? normalized
    : (item.image ? [{ id: `legacy-${item.id}`, url: item.image, sortOrder: 0, isPrimary: true, legacy: true }] : []);
}

export function getWarehouseCoverImage(item, fallback = '') {
  const images = serializeWarehouseImages(item);
  return images.find(image => image.isPrimary)?.url || images[0]?.url || fallback;
}
