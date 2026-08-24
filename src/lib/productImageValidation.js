export const PRODUCT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const PRODUCT_IMAGE_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);

const EXTENSIONS = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
});

export function detectProductImageMime(bytes) {
  if (!(bytes instanceof Uint8Array)) return null;
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png';
  if (bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export function validateProductImage({ type, size, bytes }) {
  if (!Number.isSafeInteger(size) || size <= 0) return { error: 'فایل تصویر خالی یا نامعتبر است.' };
  if (size > PRODUCT_IMAGE_MAX_BYTES) return { error: 'حجم تصویر نباید بیشتر از ۴ مگابایت باشد.' };
  if (!PRODUCT_IMAGE_TYPES.includes(type)) return { error: 'فرمت تصویر باید JPG، PNG یا WEBP باشد.' };
  const detectedType = detectProductImageMime(bytes);
  if (!detectedType || detectedType !== type) return { error: 'محتوای فایل با فرمت تصویر اعلام‌شده مطابقت ندارد.' };
  return { type: detectedType, extension: EXTENSIONS[detectedType] };
}
