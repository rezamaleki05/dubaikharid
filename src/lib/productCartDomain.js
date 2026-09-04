import { cartItemKey } from './clientCollectionState.js';
import { buildSelectedOptionsSnapshot } from './productVariantOrderItemDomain.js';
import { DEFAULT_PRODUCT_VARIANT_SIGNATURE } from './productVariantDomain.js';
import { resolveProductVariantPriceFromData } from './productSupplyPricingDomain.js';

const LEGACY_SIZE_CODES = new Set(['eu_size', 'clothing_size', 'shoe_size', 'size']);

export class ProductCartError extends Error {
  constructor(message, status = 409, code = 'PRODUCT_CART_INVALID', details = null) {
    super(message);
    this.name = 'ProductCartError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function normalizedText(value) {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase('en') : '';
}

function optionMatches(option, value) {
  const expected = normalizedText(value);
  return Boolean(expected) && [option.optionCode, option.labelFa, option.labelEn]
    .some(candidate => normalizedText(candidate) === expected);
}

function snapshotOptions(variant) {
  return buildSelectedOptionsSnapshot(variant.options || []);
}

function unavailable(message, code, details = null) {
  return new ProductCartError(message, 409, code, details);
}

export function resolveProductCartVariantFromData({
  product,
  productVariantId = null,
  selectedColor = null,
  selectedSize = null,
}) {
  const variants = product?.variants || [];
  if (productVariantId) {
    const variant = variants.find(candidate => candidate.id === productVariantId);
    if (!variant) throw unavailable('تنوع انتخاب‌شده به این محصول تعلق ندارد.', 'VARIANT_PRODUCT_MISMATCH');
    if (!variant.isActive) throw unavailable('تنوع انتخاب‌شده غیرفعال است.', 'VARIANT_INACTIVE');
    return variant;
  }

  const activeVariants = variants.filter(variant => variant.isActive);
  const hasLegacySelection = Boolean(normalizedText(selectedColor) || normalizedText(selectedSize));
  if (hasLegacySelection) {
    const matches = activeVariants.filter(variant => {
      const options = snapshotOptions(variant);
      const colorMatches = !selectedColor || options.some(option => option.attributeCode === 'color' && optionMatches(option, selectedColor));
      const sizeMatches = !selectedSize || options.some(option => LEGACY_SIZE_CODES.has(option.attributeCode) && optionMatches(option, selectedSize));
      return colorMatches && sizeMatches;
    });
    if (matches.length === 1) return matches[0];
    throw unavailable('انتخاب تنوع این محصول باید دوباره تأیید شود.', 'VARIANT_SELECTION_REQUIRED');
  }

  const defaultVariant = activeVariants.find(variant => (
    variant.isDefault && variant.optionSignature === DEFAULT_PRODUCT_VARIANT_SIGNATURE
  ));
  const hasVariantAxes = Number(product.variantAxisCount || 0) > 0;
  if (!hasVariantAxes && activeVariants.length === 1 && defaultVariant && snapshotOptions(defaultVariant).length === 0) {
    return defaultVariant;
  }
  throw unavailable('انتخاب تنوع محصول الزامی است.', 'VARIANT_SELECTION_REQUIRED');
}

export function serializeResolvedProductCartLine({ product, variant, pricing, quantity, requestKey }) {
  const options = snapshotOptions(variant);
  const inventoryAvailable = variant.inventory
    ? Math.max(0, variant.inventory.stock - variant.inventory.reserved)
    : null;
  let code = null;
  if (product.supplyMode === 'IRAN_STOCK' && !variant.inventory) code = 'INVENTORY_NOT_INITIALIZED';
  else if (product.supplyMode === 'IRAN_STOCK' && inventoryAvailable < quantity) code = 'INSUFFICIENT_STOCK';
  else if (product.supplyMode === 'EXTERNAL_DUBAI' && product.warehouseItem && (
    product.warehouseItem.isArchived
    || product.warehouseItem.stock - product.warehouseItem.reserved < quantity
  )) code = 'OUT_OF_STOCK';
  const selectedColor = options.find(option => option.attributeCode === 'color')?.labelFa || null;
  const selectedSize = options.find(option => LEGACY_SIZE_CODES.has(option.attributeCode))?.labelFa || null;
  const effectiveWeight = Number(variant.weightOverride ?? product.weight);
  const key = cartItemKey({ type: 'PRODUCT', id: product.id, productVariantId: variant.id });
  return {
    type: 'PRODUCT',
    id: product.id,
    productId: product.id,
    productVariantId: variant.id,
    quantity,
    requestKey,
    key,
    authoritative: true,
    available: code === null,
    code,
    name: product.nameFa,
    nameFa: product.nameFa,
    nameEn: product.nameEn,
    brand: product.brand?.faName || product.brand?.name || '',
    store: product.store?.name || '',
    spec: product.category?.name || '',
    image: product.image || '',
    originalLink: product.originalLink || '',
    priceAed: product.supplyMode === 'EXTERNAL_DUBAI' ? Number(pricing.basePrice) : null,
    priceToman: product.supplyMode === 'IRAN_STOCK' ? pricing.basePrice : null,
    weight: effectiveWeight,
    discountPercent: pricing.discountPercent,
    selectedColor,
    selectedSize,
    supplyMode: product.supplyMode,
    variant: {
      id: variant.id,
      sku: variant.sku || null,
      options,
    },
    pricing: {
      currencySource: pricing.currencySource,
      basePrice: pricing.basePrice,
      discountPercent: pricing.discountPercent,
      discountedBasePrice: pricing.discountedBasePrice,
      finalPriceToman: pricing.finalPriceToman,
      weight: effectiveWeight,
      billableWeight: Number(pricing.weight),
    },
    inventory: product.supplyMode === 'IRAN_STOCK'
      ? { available: inventoryAvailable, inStock: inventoryAvailable !== null && inventoryAvailable >= quantity }
      : null,
  };
}

export function resolveProductCartLineFromData({ product, line, settings = null }) {
  const variant = resolveProductCartVariantFromData({
    product,
    productVariantId: line.productVariantId,
    selectedColor: line.selectedColor,
    selectedSize: line.selectedSize,
  });
  const pricing = resolveProductVariantPriceFromData({ product, variant, settings });
  return serializeResolvedProductCartLine({
    product,
    variant,
    pricing,
    quantity: line.quantity,
    requestKey: line.requestKey,
  });
}

export function publicVariantAxes(variants) {
  const axes = new Map();
  for (const variant of variants) {
    for (const option of publicVariantOptions(variant)) {
      const axis = axes.get(option.attributeCode) || {
        id: option.attributeId,
        code: option.attributeCode,
        nameFa: option.attributeNameFa,
        nameEn: option.attributeNameEn,
        options: new Map(),
      };
      axis.options.set(option.optionCode, {
        id: option.optionId,
        code: option.optionCode,
        labelFa: option.labelFa,
        labelEn: option.labelEn,
        swatchHex: option.swatchHex,
      });
      axes.set(option.attributeCode, axis);
    }
  }
  return [...axes.values()].map(axis => ({ ...axis, options: [...axis.options.values()] }));
}

export function publicVariantOptions(variant) {
  const byCode = new Map((variant.options || []).map(row => [
    `${row.attribute?.code}:${row.attributeOption?.code}`,
    row,
  ]));
  return snapshotOptions(variant).map(option => {
    const source = byCode.get(`${option.attributeCode}:${option.optionCode}`);
    return {
      attributeId: source?.attribute?.id || source?.attributeId || null,
      attributeCode: option.attributeCode,
      attributeNameFa: option.attributeNameFa,
      attributeNameEn: option.attributeNameEn,
      optionId: source?.attributeOption?.id || source?.attributeOptionId || null,
      optionCode: option.optionCode,
      labelFa: option.labelFa,
      labelEn: option.labelEn,
      swatchHex: source?.attributeOption?.swatchHex || null,
    };
  });
}

export function resolveLoadedProductCartLines(products, lines, settings = null) {
  const byId = new Map(products.map(product => [product.id, product]));
  return lines.map(line => {
    const product = byId.get(line.productId);
    if (!product) {
      throw new ProductCartError('محصول پیدا نشد یا قابل سفارش نیست.', 404, 'PRODUCT_UNAVAILABLE');
    }
    return resolveProductCartLineFromData({ product, line, settings });
  });
}
