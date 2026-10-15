import { normalizeProductImagesInput, serializeProductImages } from './productGallery.js';

export const MAX_PRODUCT_COLOR_GALLERIES = 100;

export function normalizeProductColorGalleries(value) {
  // Omitted by older clients: preserve existing color galleries on edit.
  if (value === undefined) return { data: undefined };
  if (!Array.isArray(value) || value.length > MAX_PRODUCT_COLOR_GALLERIES) {
    return { error: 'تعداد گالری‌های رنگ معتبر نیست.' };
  }
  const seen = new Set();
  const ids = new Set();
  const data = [];
  for (const gallery of value) {
    if (!gallery || typeof gallery !== 'object' || Array.isArray(gallery)
      || Object.keys(gallery).some(key => !['colorOptionId', 'images'].includes(key))
      || typeof gallery.colorOptionId !== 'string' || !gallery.colorOptionId.trim()
      || gallery.colorOptionId.length > 128 || seen.has(gallery.colorOptionId)) {
      return { error: 'شناسه گالری رنگ معتبر یا یکتا نیست.' };
    }
    seen.add(gallery.colorOptionId);
    const images = normalizeProductImagesInput(gallery.images);
    if (images.error) return images;
    for (const image of images.data) {
      if (image.id && ids.has(image.id)) return { error: 'یک تصویر نمی‌تواند به دو رنگ تعلق داشته باشد.' };
      if (image.id) ids.add(image.id);
    }
    data.push({ colorOptionId: gallery.colorOptionId, images: images.data });
  }
  return { data };
}

export function serializeProductColorGalleries(product) {
  const optionIds = [...new Set((product?.images || []).map(image => image.colorOptionId).filter(Boolean))];
  return optionIds.map(colorOptionId => ({
    colorOptionId,
    images: serializeProductImages(product, { colorOptionId }),
  }));
}

export function selectedProductColorOptionId(axes = [], selection = {}) {
  // Match semantic COLOR type, never an attribute code, label or swatch guess.
  // If a category defines multiple COLOR axes, the first configured axis owns the gallery.
  const axis = axes.find(candidate => candidate.inputType === 'COLOR');
  return axis?.options.find(option => option.code === selection[axis.code])?.id || null;
}

export function resolveProductColorGallery(product, selection = {}) {
  const colorOptionId = selectedProductColorOptionId(product?.variantAxes, selection);
  const dedicated = product?.colorGalleries?.find(gallery => gallery.colorOptionId === colorOptionId);
  return {
    key: colorOptionId || 'shared',
    colorOptionId,
    images: dedicated?.images?.length ? dedicated.images : (product?.images || []),
    dedicated: Boolean(dedicated?.images?.length),
  };
}
