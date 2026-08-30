export const CART_STORAGE_KEY = 'dubaikharid_cart_v1';
export const WISHLIST_STORAGE_KEY = 'dubaikharid_wishlist_v1';
export const LEGACY_CART_STORAGE_KEY = 'dubaiKharidCart';
export const LEGACY_WISHLIST_STORAGE_KEY = 'dubaiKharidWishlist';
export const CART_ITEM_TYPES = new Set(['PRODUCT', 'WAREHOUSE', 'LAPTOP', 'EXTERNAL_PRODUCT']);
export const MAX_PRODUCT_QUANTITY = 20;

const LAPTOP_TYPES = new Set(['laptop_stock', 'stock_laptop']);

function cleanText(value, maximum = 300) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maximum);
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function inferCollectionItemType(item) {
  if (CART_ITEM_TYPES.has(item?.type)) return item.type;
  if (item?.laptopId || LAPTOP_TYPES.has(item?.product_type)) return 'LAPTOP';
  if (item?.warehouseItemId || item?.product_type === 'warehouse_stock') return 'WAREHOUSE';
  if (item?.productId || item?.product_type === 'iran_inventory') return 'PRODUCT';
  return 'EXTERNAL_PRODUCT';
}

export function collectionItemId(item, type = inferCollectionItemType(item)) {
  const value = type === 'LAPTOP'
    ? (item?.laptopId || item?.id)
    : type === 'WAREHOUSE'
      ? (item?.warehouseItemId || item?.id)
    : type === 'PRODUCT'
      ? (item?.productId || item?.id)
      : item?.id;
  const id = cleanText(value, 160);
  return id || null;
}

function displaySnapshot(item) {
  const source = item?.snapshot && typeof item.snapshot === 'object' ? { ...item.snapshot, ...item } : item;
  return {
    name: cleanText(source?.name, 300),
    brand: cleanText(source?.brand, 160),
    store: cleanText(source?.store, 160),
    spec: cleanText(source?.spec, 500),
    image: cleanText(source?.image || source?.img, 2048),
    originalLink: cleanText(source?.originalLink || source?.link, 2048),
    priceAed: finiteNumber(source?.priceAed),
    priceToman: finiteNumber(source?.priceToman ?? source?.price),
    weight: finiteNumber(source?.weight ?? source?.weightKg),
    discountPercent: Math.min(100, Math.max(0, Number.parseInt(source?.discountPercent || 0, 10) || 0)),
  };
}

export function cartItemKey(item) {
  const options = item.type === 'LAPTOP' ? ['', ''] : [item.selectedSize || '', item.selectedColor || ''];
  return [item.type, item.id, ...options]
    .map(value => encodeURIComponent(value))
    .join(':');
}

export function normalizeCartItem(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const type = inferCollectionItemType(item);
  const id = collectionItemId(item, type);
  if (!id) return null;
  const rawQuantity = Number(item.quantity ?? 1);
  if (!Number.isSafeInteger(rawQuantity) || rawQuantity < 1) return null;
  const normalized = {
    type,
    id,
    quantity: type === 'LAPTOP' ? 1 : Math.min(rawQuantity, MAX_PRODUCT_QUANTITY),
    selectedSize: cleanText(item.selectedSize || item.size, 120) || null,
    selectedColor: cleanText(item.selectedColor || item.color, 120) || null,
    snapshot: displaySnapshot(item),
  };
  normalized.key = cartItemKey(normalized);
  return normalized;
}

export function normalizeWishlistItem(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const type = inferCollectionItemType(item);
  const id = collectionItemId(item, type);
  if (!id) return null;
  return { type, id, key: `${type}:${encodeURIComponent(id)}`, snapshot: displaySnapshot(item) };
}

function parseCollection(raw, normalizer) {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unique = new Map();
    for (const candidate of parsed.slice(0, 100)) {
      const item = normalizer(candidate);
      if (!item) continue;
      if (normalizer === normalizeCartItem && unique.has(item.key) && item.type !== 'LAPTOP') {
        const existing = unique.get(item.key);
        unique.set(item.key, { ...existing, quantity: Math.min(MAX_PRODUCT_QUANTITY, existing.quantity + item.quantity) });
      } else {
        unique.set(item.key, item);
      }
    }
    return [...unique.values()];
  } catch {
    return [];
  }
}

export const parseCartStorage = raw => parseCollection(raw, normalizeCartItem);
export const parseWishlistStorage = raw => parseCollection(raw, normalizeWishlistItem);

export function resolverPayload(items) {
  return items.map(item => ({
    type: item.type,
    id: item.id,
    ...(Object.hasOwn(item, 'quantity') ? { quantity: item.quantity } : {}),
    ...(item.selectedColor ? { selectedColor: item.selectedColor } : {}),
    ...(item.selectedSize ? { selectedSize: item.selectedSize } : {}),
  }));
}
