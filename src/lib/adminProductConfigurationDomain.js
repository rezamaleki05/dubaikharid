import { normalizeProductAttributeValueInputs } from './catalogAttributeDomain.js';
import { validateInitializeProductInventoryPayload } from './productInventoryDomain.js';
import {
  MAX_PRODUCT_VARIANT_COMBINATIONS,
  validateCreateProductVariantPayload,
} from './productVariantDomain.js';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function strictObject(value, allowed, message = 'فیلد غیرمجاز در درخواست وجود دارد.') {
  if (!isObject(value)) return { error: 'بدنه درخواست معتبر نیست.' };
  return Object.keys(value).some(key => !allowed.has(key)) ? { error: message } : null;
}

export function normalizeAdminProductConfigurationPayload(body) {
  const shapeError = strictObject(body, new Set(['product', 'attributeValues', 'variants']));
  if (shapeError) return shapeError;
  if (!isObject(body.product)) return { error: 'اطلاعات پایه محصول معتبر نیست.' };

  const attributeValues = normalizeProductAttributeValueInputs(body.attributeValues);
  if (attributeValues.error) return attributeValues;

  if (!Array.isArray(body.variants) || body.variants.length < 1
    || body.variants.length > MAX_PRODUCT_VARIANT_COMBINATIONS) {
    return { error: `تعداد تنوع‌های انتخاب‌شده باید بین ۱ و ${MAX_PRODUCT_VARIANT_COMBINATIONS} باشد.` };
  }

  const ids = new Set();
  const variants = [];
  for (const candidate of body.variants) {
    const variantShape = strictObject(candidate, new Set([
      'id', 'optionIds', 'sku', 'isActive', 'sortOrder',
      'priceAedOverride', 'priceTomanOverride', 'discountPercentOverride', 'weightOverride',
      'inventory',
    ]), 'فیلد غیرمجاز در تنظیمات تنوع وجود دارد.');
    if (variantShape) return variantShape;

    const variantInput = Object.fromEntries(
      Object.entries(candidate).filter(([key]) => !['id', 'inventory'].includes(key)),
    );
    const parsed = validateCreateProductVariantPayload(variantInput);
    if (parsed.error) return parsed;
    let id = null;
    if (Object.hasOwn(candidate, 'id') && candidate.id !== null) {
      if (typeof candidate.id !== 'string' || !candidate.id.trim() || candidate.id.length > 128) {
        return { error: 'شناسه تنوع معتبر نیست.' };
      }
      id = candidate.id.trim();
      if (ids.has(id)) return { error: 'شناسه تنوع تکراری است.' };
      ids.add(id);
    }

    let inventory = null;
    if (candidate.inventory !== null && candidate.inventory !== undefined) {
      const parsedInventory = validateInitializeProductInventoryPayload(candidate.inventory);
      if (parsedInventory.error) return parsedInventory;
      inventory = parsedInventory.data;
    }
    variants.push({ ...parsed.data, id, inventory });
  }

  return {
    data: {
      product: body.product,
      attributeValues: attributeValues.data,
      variants,
    },
  };
}

export function buildVariantOptionCombinations(optionGroups) {
  if (!Array.isArray(optionGroups) || optionGroups.length === 0) return [[]];
  let combinations = [[]];
  for (const group of optionGroups) {
    if (!Array.isArray(group) || group.length === 0) return [];
    combinations = combinations.flatMap(combination => group.map(optionId => [...combination, optionId]));
    if (combinations.length > MAX_PRODUCT_VARIANT_COMBINATIONS) return combinations;
  }
  return combinations;
}
