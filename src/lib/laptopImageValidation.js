import { detectProductImageMime, PRODUCT_IMAGE_TYPES } from './productImageValidation.js';

export const LAPTOP_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const LAPTOP_IMAGE_TYPES = PRODUCT_IMAGE_TYPES;

const EXTENSIONS = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
});

export function validateLaptopImage({ type, size, bytes }) {
  if (!Number.isSafeInteger(size) || size <= 0) {
    return { error: 'فایل تصویر خالی یا نامعتبر است.' };
  }
  if (size > LAPTOP_IMAGE_MAX_BYTES) {
    return { error: 'حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.' };
  }
  if (!LAPTOP_IMAGE_TYPES.includes(type)) {
    return { error: 'فرمت تصویر باید JPG، PNG یا WEBP باشد.' };
  }
  const detectedType = detectProductImageMime(bytes);
  if (!detectedType || detectedType !== type) {
    return { error: 'محتوای فایل با فرمت تصویر اعلام‌شده مطابقت ندارد.' };
  }
  return { type: detectedType, extension: EXTENSIONS[detectedType] };
}
