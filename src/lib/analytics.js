import { sendGAEvent } from '@next/third-parties/google';

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;
const GA_CURRENCY = 'AED';
const PENDING_PURCHASES_KEY = 'dubaikharid_ga_pending_purchases_v1';
const SENT_PURCHASES_KEY = 'dubaikharid_ga_sent_purchases_v1';
const MAX_STORED_TRANSACTION_IDS = 100;
const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

function cleanText(value, maximum = 200) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maximum);
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function positiveQuantity(value) {
  const number = Number(value ?? 1);
  return Number.isSafeInteger(number) && number > 0 ? number : 1;
}

function itemCategory(value) {
  if (typeof value === 'string') return cleanText(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  return cleanText(value.name || value.faName || value.query || value.slug);
}

function itemBrand(value) {
  if (typeof value === 'string') return cleanText(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  return cleanText(value.name || value.faName);
}

function unitPriceAed(item) {
  const source = item?.snapshot && typeof item.snapshot === 'object'
    ? { ...item.snapshot, ...item }
    : item;
  const price = finiteNumber(source?.priceAed);
  if (price === null) return null;
  const discount = Math.min(100, Math.max(0, finiteNumber(source?.discountPercent) || 0));
  return Number((price * (1 - (discount / 100))).toFixed(2));
}

function toGaItem(item, quantityOverride) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const source = item.snapshot && typeof item.snapshot === 'object'
    ? { ...item.snapshot, ...item }
    : item;
  const itemId = cleanText(source.productId || source.laptopId || source.id || source.key, 160);
  const itemName = cleanText(source.name || source.productName, 300);
  if (!itemId || !itemName) return null;

  const price = unitPriceAed(source);
  const brand = itemBrand(source.brand);
  const category = itemCategory(source.category || source.categoryName);
  const variant = [cleanText(source.selectedColor || source.color, 80), cleanText(source.selectedSize || source.size, 80)]
    .filter(Boolean)
    .join(' / ');

  return {
    item_id: itemId,
    item_name: itemName,
    ...(brand ? { item_brand: brand } : {}),
    ...(category ? { item_category: category } : {}),
    ...(price !== null ? { price } : {}),
    quantity: positiveQuantity(quantityOverride ?? source.quantity),
    ...(variant ? { item_variant: variant } : {}),
  };
}

function ecommercePayload(items, quantityOverride) {
  const gaItems = (Array.isArray(items) ? items : [items])
    .map(item => toGaItem(item, quantityOverride))
    .filter(Boolean);
  const hasCompleteValue = gaItems.length > 0 && gaItems.every(item => Number.isFinite(item.price));
  const value = hasCompleteValue
    ? Number(gaItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2))
    : null;
  return {
    currency: GA_CURRENCY,
    ...(value !== null ? { value } : {}),
    items: gaItems,
  };
}

function readStoredIds(key) {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter(value => typeof value === 'string').slice(-MAX_STORED_TRANSACTION_IDS) : [];
  } catch {
    return [];
  }
}

function writeStoredIds(key, values) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify([...new Set(values)].slice(-MAX_STORED_TRANSACTION_IDS)));
  } catch {
    // Analytics must never interrupt checkout when browser storage is unavailable.
  }
}

export function trackEvent(eventName, parameters = {}) {
  if (
    typeof window === 'undefined'
    || !measurementId
    || !GA_MEASUREMENT_ID_PATTERN.test(measurementId)
    || !Array.isArray(window.dataLayer)
    || typeof eventName !== 'string'
    || !eventName.trim()
  ) {
    return false;
  }

  const safeParameters = parameters && typeof parameters === 'object' && !Array.isArray(parameters)
    ? parameters
    : {};
  sendGAEvent('event', eventName.trim(), safeParameters);
  return true;
}

export function trackViewItem(product) {
  const payload = ecommercePayload(product);
  return payload.items.length > 0 && trackEvent('view_item', payload);
}

export function trackAddToCart(item, quantity = 1) {
  const payload = ecommercePayload(item, quantity);
  return payload.items.length > 0 && trackEvent('add_to_cart', payload);
}

export function trackRemoveFromCart(item, quantity) {
  const payload = ecommercePayload(item, quantity);
  return payload.items.length > 0 && trackEvent('remove_from_cart', payload);
}

export function trackViewCart(items) {
  return trackEvent('view_cart', ecommercePayload(items));
}

export function trackBeginCheckout(items) {
  const payload = ecommercePayload(items);
  return payload.items.length > 0 && trackEvent('begin_checkout', payload);
}

export function markPurchasePending(orderCode) {
  const safeOrderCode = cleanText(orderCode, 160);
  if (!safeOrderCode) return false;
  writeStoredIds(PENDING_PURCHASES_KEY, [...readStoredIds(PENDING_PURCHASES_KEY), safeOrderCode]);
  return true;
}

export function trackPurchaseOnce(order) {
  if (!order || order.paymentStatus !== 'paid') return false;
  const orderCode = cleanText(order.orderCode || order.id, 160);
  if (!orderCode) return false;

  const pending = readStoredIds(PENDING_PURCHASES_KEY);
  const sent = readStoredIds(SENT_PURCHASES_KEY);
  if (!pending.includes(orderCode) || sent.includes(orderCode)) return false;

  const payload = ecommercePayload(order.items || []);
  if (payload.items.length === 0) return false;
  const tracked = trackEvent('purchase', { transaction_id: orderCode, ...payload });
  if (!tracked) return false;

  writeStoredIds(SENT_PURCHASES_KEY, [...sent, orderCode]);
  writeStoredIds(PENDING_PURCHASES_KEY, pending.filter(value => value !== orderCode));
  return true;
}

export function trackWhatsAppClick(placement) {
  const linkLocation = cleanText(placement, 80);
  return Boolean(linkLocation) && trackEvent('whatsapp_click', { link_location: linkLocation });
}
