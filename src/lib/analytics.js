import { isPublicAnalyticsLocation, analyticsPageContext, analyticsBrowserExcluded } from './analyticsPolicy.js';

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;
// GA4 requires an ISO currency: customer Toman amounts are represented as Rial.
const GA_CURRENCY = 'IRR';
const pendingEvents = [];
const sentLeads = new Set();
let initialized = false;
const PENDING_PURCHASES_KEY = 'dubaikharid_ga_pending_purchases_v1';
const SENT_PURCHASES_KEY = 'dubaikharid_ga_sent_purchases_v1';
const MAX_STORED_TRANSACTION_IDS = 100;
const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

function cleanText(value, maximum = 200) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maximum);
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
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

function unitPriceRial(item) {
  const source = item?.snapshot && typeof item.snapshot === 'object' ? { ...item.snapshot, ...item } : item;
  // Never fall back to AED acquisition cost or an unconfirmed foreign quote.
  const exact = source?.finalUnitPriceTomanSnapshot ?? source?.pricing?.finalPriceToman ?? source?.finalPriceToman ?? source?.unitPriceToman ?? (source?.priceRange?.varies === false ? source.priceRange.minimumFinalPriceToman : null);
  const base = source?.supplyMode === 'EXTERNAL_DUBAI' || source?.priceRange?.varies ? null : source?.priceToman;
  const toman = finiteNumber(exact ?? base);
  if (toman === null || (exact == null && base == null)) return null;
  const discount = exact == null ? Math.min(100, Math.max(0, finiteNumber(source?.discountPercent) || 0)) : 0;
  const rial = Math.round(toman * (1 - discount / 100) * 10);
  return Number.isSafeInteger(rial) ? rial : null;
}

function toGaItem(item, quantityOverride) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const source = item.snapshot && typeof item.snapshot === 'object'
    ? { ...item.snapshot, ...item }
    : item;
  const itemId = cleanText(source.productId || source.laptopId || source.id || source.key, 160);
  const itemName = cleanText(source.name || source.productName, 300);
  if (!itemId || !itemName) return null;

  const price = unitPriceRial(source);
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

function eligible() {
  return typeof window !== 'undefined' && isPublicAnalyticsLocation(window.location, { automated: analyticsBrowserExcluded(window) })
    && window.__dkAnalyticsEnabled !== false && measurementId && GA_MEASUREMENT_ID_PATTERN.test(measurementId);
}
function send() { window.dataLayer.push(arguments); }

export function initializePublicAnalytics(gaId) {
  if (!eligible() || gaId !== measurementId) { pendingEvents.length = 0; return false; }
  window.dataLayer ||= [];
  window.gtag ||= function () { window.dataLayer.push(arguments); };
  if (!initialized) {
    send('js', new Date());
    const context = analyticsPageContext(window.location);
    let referrer = '';
    try { referrer = new URL(window.document?.referrer || '').origin; } catch {}
    send('config', gaId, { send_page_view: false, page_location: window.location.origin + window.location.pathname, page_title: `DubaiKharid | ${context.page_type}`, page_referrer: referrer });
    initialized = true;
  }
  return true;
}
export function flushAnalyticsEvents() {
  const events = pendingEvents.splice(0);
  if (!eligible() || !initialized) return;
  for (const event of events) send(...event);
}

export function trackEvent(eventName, parameters = {}) {
  if (!eligible()) return false;
  const commerce = new Set(['view_item', 'add_to_cart', 'remove_from_cart', 'view_cart', 'begin_checkout', 'purchase']);
  let safe;
  if (commerce.has(eventName)) {
    // Only internal ecommerce builders may supply items; discard arbitrary top-level fields.
    safe = { currency: GA_CURRENCY, items: (Array.isArray(parameters.items) ? parameters.items : []).filter(item => item && typeof item === 'object').map(item => Object.fromEntries(['item_id', 'item_name', 'item_brand', 'item_category', 'item_variant', 'price', 'quantity'].filter(key => item[key] !== undefined).map(key => [key, item[key]]))), ...(Number.isFinite(parameters.value) ? { value: parameters.value } : {}), ...(eventName === 'purchase' ? { transaction_id: parameters.transaction_id } : {}) };
  } else if (eventName === 'whatsapp_click') {
    if (!['footer', 'manual_payment', 'profile_support'].includes(parameters.link_location)) return false;
    safe = { link_location: parameters.link_location };
  }
  else if (eventName === 'lead_created') {
    if (!['quick_request', 'checkout_request', 'product_inquiry', 'profile_request'].includes(parameters.form_name)) return false;
    safe = { lead_type: 'purchase_request', form_name: parameters.form_name };
  }
  else if (eventName === 'page_view') safe = { page_location: window.location.origin + window.location.pathname };
  else return false;
  const context = analyticsPageContext(window.location);
  safe = { ...safe, ...context, page_location: window.location.origin + window.location.pathname, page_title: `DubaiKharid | ${context.page_type}` };
  const event = ['event', eventName, safe];
  if (!initialized) { if (pendingEvents.length < 20) pendingEvents.push(event); return true; }
  send(...event);
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

  const sent = readStoredIds(SENT_PURCHASES_KEY);
  if (sent.includes(orderCode)) return false;

  const payload = ecommercePayload(order.items || []);
  if (payload.items.length === 0) return false;
  const tracked = trackEvent('purchase', { transaction_id: orderCode, ...payload });
  if (!tracked) return false;

  const pending = readStoredIds(PENDING_PURCHASES_KEY);
  writeStoredIds(SENT_PURCHASES_KEY, [...sent, orderCode]);
  writeStoredIds(PENDING_PURCHASES_KEY, pending.filter(value => value !== orderCode));
  return true;
}

export function trackWhatsAppClick(placement) {
  if (!['footer', 'manual_payment', 'profile_support'].includes(placement)) return false;
  return trackEvent('whatsapp_click', { link_location: placement });
}

export function trackLeadCreated(record, formName) {
  if (!record || typeof record.id !== 'string' || !record.id || !['quick_request', 'checkout_request', 'product_inquiry', 'profile_request'].includes(formName)) return false;
  const key = 'dubaikharid_ga_sent_leads_v1';
  const sent = readStoredIds(key);
  if (sent.includes(record.id) || sentLeads.has(record.id)) return false;
  const tracked = trackEvent('lead_created', { form_name: formName });
  if (tracked) { sentLeads.add(record.id); writeStoredIds(key, [...sent, record.id]); }
  return tracked;
}
