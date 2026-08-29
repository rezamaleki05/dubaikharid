import * as cheerio from 'cheerio';
import { getProductSource } from './adapters.js';

const CONFIDENCE = Object.freeze({ HIGH: 'high', MEDIUM: 'medium', LOW: 'low' });
const INSTALLMENT_PATTERN = /\b(?:installment|monthly|per\s+month|\/\s*month|emi|tabby|tamara|قس(?:ط|طی)|شهریه)\b/i;
const COUPON_PATTERN = /\b(?:coupon|promo|with\s+code|use\s+code|voucher|کد\s*تخفیف)\b/i;

function cleanText(value, maximum = 500) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, maximum) : null;
}

function firstValue(...values) {
  return values.find(value => value !== null && value !== undefined && value !== '') ?? null;
}

function metaContent($, keys) {
  for (const key of keys) {
    const value = $(`meta[property="${key}"], meta[name="${key}"]`).first().attr('content');
    const cleaned = cleanText(value, 2048);
    if (cleaned) return cleaned;
  }
  return null;
}

function readSelectorText($, selectors) {
  for (const selector of selectors || []) {
    const value = cleanText($(selector).first().text());
    if (value) return value;
  }
  return null;
}

function readSelectorImage($, selectors) {
  for (const selector of selectors || []) {
    const element = $(selector).first();
    const value = cleanText(element.attr('src') || element.attr('data-src') || element.attr('data-old-hires'), 2048);
    if (value) return value;
  }
  return null;
}

function containsType(value, expected) {
  if (Array.isArray(value)) return value.some(item => containsType(item, expected));
  return typeof value === 'string' && value.split('/').pop()?.toLowerCase() === expected.toLowerCase();
}

function findTypedObjects(value, expected, found = []) {
  if (!value || typeof value !== 'object') return found;
  if (containsType(value['@type'], expected)) found.push(value);
  if (Array.isArray(value)) {
    for (const item of value) findTypedObjects(item, expected, found);
  } else {
    for (const child of Object.values(value)) findTypedObjects(child, expected, found);
  }
  return found;
}

function parseJsonLdProducts($) {
  const products = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).text().trim();
    if (!raw || raw.length > 1_000_000) return;
    try {
      products.push(...findTypedObjects(JSON.parse(raw), 'Product'));
    } catch {
      // Invalid third-party JSON-LD is ignored and regular metadata remains available.
    }
  });
  return products;
}

function findEmbeddedProduct(value, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 18) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findEmbeddedProduct(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  const title = cleanText(value.title || value.name, 300);
  const priceObject = value.salePrice || value.currentPrice || value.price;
  const currency = value.currency || value.currencyCode || priceObject?.currency || priceObject?.priceCurrency;
  const amount = typeof priceObject === 'object'
    ? firstValue(priceObject.value, priceObject.amount, priceObject.price)
    : priceObject;
  const hasProductIdentity = Boolean(value.sku || value.productId || value.productID || value.url || value.canonicalUrl);
  if (title && hasProductIdentity && normalizeCurrency(currency) && parsePositivePrice(amount)) {
    return {
      title,
      brand: readBrand(value.brand || value.brandName),
      priceAed: parsePositivePrice(amount),
      imageUrl: readImage(value.image || value.images || value.imageUrl),
      categorySuggestion: categoryFromText(value.category || value.categoryName),
      variant: explicitVariant(value),
    };
  }
  for (const child of Object.values(value)) {
    const found = findEmbeddedProduct(child, depth + 1);
    if (found) return found;
  }
  return null;
}

function embeddedFields($, source) {
  for (const selector of source.embeddedScriptSelectors || []) {
    for (const element of $(selector).toArray()) {
      const raw = $(element).text().trim();
      if (!raw || raw.length > 1_000_000) continue;
      try {
        const product = findEmbeddedProduct(JSON.parse(raw));
        if (!product) continue;
        return {
          title: makeField(product.title, CONFIDENCE.HIGH),
          brand: makeField(product.brand, CONFIDENCE.MEDIUM),
          priceAed: makeField(product.priceAed, CONFIDENCE.HIGH),
          imageUrl: makeField(product.imageUrl, CONFIDENCE.MEDIUM),
          categorySuggestion: makeField(product.categorySuggestion, CONFIDENCE.HIGH),
          variant: makeField(product.variant, CONFIDENCE.HIGH),
        };
      } catch {
        // Embedded third-party data is optional and may not be valid JSON.
      }
    }
  }
  return {};
}

function readBrand(value) {
  if (typeof value === 'string') return cleanText(value, 160);
  if (value && typeof value === 'object') return cleanText(value.name, 160);
  return null;
}

function readImage(value) {
  if (typeof value === 'string') return cleanText(value, 2048);
  if (Array.isArray(value)) return firstValue(...value.map(readImage));
  if (value && typeof value === 'object') return cleanText(value.url || value.contentUrl, 2048);
  return null;
}

function parsePositivePrice(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/[٬,\s]/g, '').replace(/[^\d.]/g, '');
  if (!normalized || (normalized.match(/\./g) || []).length > 1) return null;
  const price = Number(normalized);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function normalizeCurrency(value) {
  const currency = cleanText(value, 12)?.toUpperCase();
  return currency === 'AED' || currency === 'د.إ' || currency === 'دإ' ? 'AED' : null;
}

function offerPriceCandidate(offer) {
  if (!offer || typeof offer !== 'object') return null;
  const context = [offer.name, offer.description, offer.category].filter(Boolean).join(' ');
  if (INSTALLMENT_PATTERN.test(context) || COUPON_PATTERN.test(context)) return null;
  const currency = normalizeCurrency(offer.priceCurrency || offer.priceSpecification?.priceCurrency);
  if (!currency) return null;
  const type = Array.isArray(offer['@type']) ? offer['@type'].join(' ') : String(offer['@type'] || '');
  const aggregate = /AggregateOffer/i.test(type);
  const value = aggregate
    ? firstValue(offer.lowPrice, offer.price, offer.priceSpecification?.price)
    : firstValue(offer.price, offer.priceSpecification?.price);
  const price = parsePositivePrice(value);
  return price ? { price, currency, aggregate } : null;
}

function structuredPrice(product) {
  const rawOffers = Array.isArray(product?.offers) ? product.offers : product?.offers ? [product.offers] : [];
  const candidates = rawOffers.map(offerPriceCandidate).filter(Boolean);
  if (!candidates.length) return null;
  const uniquePrices = [...new Set(candidates.map(item => item.price))];
  if (uniquePrices.length !== 1) return null;
  return uniquePrices[0];
}

function parseAedTextPrice(text) {
  const cleaned = cleanText(text, 500);
  if (!cleaned || INSTALLMENT_PATTERN.test(cleaned) || COUPON_PATTERN.test(cleaned)) return null;
  const matches = [...cleaned.matchAll(/(?:AED|د\.?\s*إ)\s*([\d,.٬]+)|([\d,.٬]+)\s*(?:AED|د\.?\s*إ)/gi)];
  const prices = [...new Set(matches.map(match => parsePositivePrice(match[1] || match[2])).filter(Boolean))];
  return prices.length === 1 ? prices[0] : null;
}

function metaPrice($) {
  const amount = metaContent($, ['product:price:amount', 'og:price:amount']);
  const currency = metaContent($, ['product:price:currency', 'og:price:currency']);
  if (!normalizeCurrency(currency)) return null;
  return parsePositivePrice(amount);
}

function categoryFromText(value) {
  const text = cleanText(value, 1000)?.toLowerCase() || '';
  const rules = [
    ['bags', /\b(?:bag|handbag|tote|backpack|purse|wallet|کیف)\b/i],
    ['shoes', /\b(?:shoe|shoes|sneaker|sneakers|boot|sandals?|کفش|کتانی)\b/i],
    ['electronics', /\b(?:laptop|notebook|phone|mobile|tablet|headphone|camera|electronics?|موبایل|لپ\s*تاپ|الکترونیک)\b/i],
    ['beauty', /\b(?:beauty|perfume|fragrance|skincare|makeup|cream|عطر|آرایش|زیبایی)\b/i],
    ['clothing', /\b(?:shirt|dress|jacket|coat|jeans|hoodie|clothing|apparel|پوشاک|پیراهن|شلوار)\b/i],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || null;
}

function explicitVariant(product) {
  const parts = [cleanText(product?.color, 100), cleanText(product?.size, 100)].filter(Boolean);
  return parts.length ? parts.join(' / ') : null;
}

function makeField(value, confidence) {
  return value === null || value === undefined || value === '' ? null : { value, confidence };
}

function structuredFields(products) {
  const product = products[0];
  if (!product) return {};
  const category = categoryFromText(product.category);
  return {
    title: makeField(cleanText(product.name, 300), CONFIDENCE.HIGH),
    brand: makeField(readBrand(product.brand), CONFIDENCE.HIGH),
    priceAed: makeField(structuredPrice(product), CONFIDENCE.HIGH),
    imageUrl: makeField(readImage(product.image), CONFIDENCE.HIGH),
    categorySuggestion: makeField(category, category ? CONFIDENCE.HIGH : null),
    variant: makeField(explicitVariant(product), CONFIDENCE.HIGH),
  };
}

function adapterFields($, source) {
  const title = readSelectorText($, source.titleSelectors);
  const brandText = readSelectorText($, source.brandSelectors);
  const normalizedBrand = source.id === 'amazon_uae'
    ? brandText?.replace(/^Visit the\s+/i, '').replace(/\s+Store$/i, '').replace(/^Brand:\s*/i, '').trim() || null
    : brandText;
  const priceText = readSelectorText($, source.priceSelectors);
  return {
    title: makeField(title, CONFIDENCE.MEDIUM),
    brand: makeField(normalizedBrand, CONFIDENCE.MEDIUM),
    priceAed: makeField(parseAedTextPrice(priceText), CONFIDENCE.MEDIUM),
    imageUrl: makeField(readSelectorImage($, source.imageSelectors), CONFIDENCE.MEDIUM),
  };
}

function metaFields($) {
  return {
    title: makeField(metaContent($, ['og:title', 'twitter:title']) || cleanText($('title').first().text(), 300), CONFIDENCE.MEDIUM),
    brand: makeField(metaContent($, ['product:brand', 'og:brand']), CONFIDENCE.MEDIUM),
    priceAed: makeField(metaPrice($), CONFIDENCE.MEDIUM),
    imageUrl: makeField(metaContent($, ['og:image:secure_url', 'og:image', 'twitter:image']), CONFIDENCE.MEDIUM),
  };
}

function selectField(...candidates) {
  return candidates.find(Boolean) || null;
}

export function parseProductHtml(html, pageUrl) {
  const source = getProductSource(pageUrl);
  if (!source) throw new Error('UNSUPPORTED_STORE');
  const $ = cheerio.load(typeof html === 'string' ? html : '');
  const structured = structuredFields(parseJsonLdProducts($));
  const embedded = embeddedFields($, source);
  const adapter = adapterFields($, source);
  const meta = metaFields($);
  const title = selectField(structured.title, embedded.title, meta.title, adapter.title);
  const brand = selectField(structured.brand, embedded.brand, meta.brand, adapter.brand);
  const priceAed = selectField(structured.priceAed, embedded.priceAed, meta.priceAed, adapter.priceAed);
  const imageUrl = selectField(structured.imageUrl, embedded.imageUrl, meta.imageUrl, adapter.imageUrl);
  const explicitCategory = selectField(structured.categorySuggestion, embedded.categorySuggestion);
  const inferredCategory = categoryFromText(title?.value);
  const categorySuggestion = selectField(
    explicitCategory,
    makeField(inferredCategory, inferredCategory ? CONFIDENCE.MEDIUM : null),
  );

  const fields = {
    title: title?.value ?? null,
    brand: brand?.value ?? null,
    priceAed: priceAed?.value ?? null,
    imageUrl: imageUrl?.value ?? null,
    categorySuggestion: categorySuggestion?.value ?? null,
    variant: selectField(structured.variant, embedded.variant)?.value ?? null,
    weight: null,
  };
  const confidence = Object.fromEntries(Object.entries(fields).map(([key, value]) => {
    const selected = key === 'title' ? title
      : key === 'brand' ? brand
        : key === 'priceAed' ? priceAed
          : key === 'imageUrl' ? imageUrl
            : key === 'categorySuggestion' ? categorySuggestion
              : key === 'variant' ? selectField(structured.variant, embedded.variant)
                : null;
    return [key, value === null ? null : selected?.confidence || null];
  }));
  const warnings = [];
  if (!fields.title) warnings.push('TITLE_NOT_FOUND');
  if (!fields.priceAed) warnings.push('PRICE_NOT_FOUND');
  if (!fields.brand) warnings.push('BRAND_NOT_FOUND');

  return { source: source.id, sourceLabel: source.label, fields, confidence, warnings };
}

export { parseAedTextPrice };
