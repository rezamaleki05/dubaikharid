import { meaningfulSearchTerms, normalizeSearchText, searchTokens } from './searchNormalization.js';

const LAPTOP_CATALOG_TERMS = new Set(['لپ', 'تاپ', 'لپتاپ', 'استوک']);

function normalizedIdentityPart(value) {
  return normalizeSearchText(value).toLocaleLowerCase('en-US');
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).slice(0, 6);
}

function slugPart(value) {
  return normalizeSearchText(value)
    .toLocaleLowerCase('en-US')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function laptopModelIdentity(brand, model) {
  const normalizedBrand = normalizedIdentityPart(brand);
  const normalizedModel = normalizedIdentityPart(model);
  return normalizedBrand && normalizedModel ? `${normalizedBrand}|${normalizedModel}` : '';
}

export function laptopModelBaseSlug(brand, model) {
  const identity = laptopModelIdentity(brand, model);
  const slug = slugPart(`${brand || ''} ${model || ''}`);
  return slug || (identity ? `laptop-${stableHash(identity)}` : 'laptop-model');
}

export function isSellableLaptopUnit(laptop) {
  return laptop?.status === 'AVAILABLE'
    && !laptop.archivedAt
    && !laptop.reservedOrderId
    && Number(laptop.priceToman) > 0
    && Boolean(laptopModelIdentity(laptop.brand, laptop.model));
}

function publicImageList(laptop) {
  const images = Array.isArray(laptop.images)
    ? laptop.images.filter(image => typeof image === 'string' && image.trim())
    : [];
  if (typeof laptop.image === 'string' && laptop.image.trim() && !images.includes(laptop.image)) {
    images.unshift(laptop.image);
  }
  return images;
}

function serializeUnit(laptop) {
  const images = publicImageList(laptop);
  return {
    id: laptop.id,
    brand: String(laptop.brand || '').trim(),
    model: String(laptop.model || '').trim(),
    name: String(laptop.name || '').trim() || `${laptop.brand} ${laptop.model}`,
    cpu: laptop.cpu || null,
    ram: laptop.ram || null,
    storage: laptop.storage || null,
    secondaryStorage: laptop.secondaryStorage || null,
    gpu: laptop.gpu || null,
    screen: laptop.screen || null,
    manufactureYear: laptop.manufactureYear ?? null,
    batteryHealth: laptop.batteryHealth ?? null,
    condition: laptop.condition || null,
    description: laptop.description || null,
    priceToman: String(laptop.priceToman),
    image: images[0] || '/images/product-placeholder.svg',
    images,
    updatedAt: laptop.updatedAt,
    product_type: 'laptop_stock',
    category: 'electronics',
    store: 'انبار ایران',
    inStock: true,
    available: true,
  };
}

export function buildLaptopModelGroups(laptops) {
  const grouped = new Map();
  for (const laptop of laptops || []) {
    if (!isSellableLaptopUnit(laptop)) continue;
    const identity = laptopModelIdentity(laptop.brand, laptop.model);
    const units = grouped.get(identity) || [];
    units.push(serializeUnit(laptop));
    grouped.set(identity, units);
  }

  const groups = [...grouped.entries()].map(([identity, units]) => {
    units.sort((left, right) => Number(left.priceToman) - Number(right.priceToman) || left.id.localeCompare(right.id));
    const representative = units.find(unit => unit.image !== '/images/product-placeholder.svg') || units[0];
    const prices = units.map(unit => BigInt(unit.priceToman));
    const lowPrice = prices.reduce((minimum, price) => price < minimum ? price : minimum);
    const highPrice = prices.reduce((maximum, price) => price > maximum ? price : maximum);
    return {
      identity,
      baseSlug: laptopModelBaseSlug(representative.brand, representative.model),
      brand: representative.brand,
      model: representative.model,
      name: `${representative.brand} ${representative.model} استوک`,
      image: representative.image,
      images: representative.images,
      description: representative.description,
      lowPriceToman: lowPrice.toString(),
      highPriceToman: highPrice.toString(),
      priceVaries: lowPrice !== highPrice,
      availableCount: units.length,
      updatedAt: units.reduce((latest, unit) => unit.updatedAt > latest ? unit.updatedAt : latest, units[0].updatedAt),
      units,
    };
  });

  const slugCounts = new Map();
  for (const group of groups) slugCounts.set(group.baseSlug, (slugCounts.get(group.baseSlug) || 0) + 1);
  return groups
    .map(group => ({
      ...group,
      slug: slugCounts.get(group.baseSlug) > 1
        ? `${group.baseSlug}-${stableHash(group.identity)}`
        : group.baseSlug,
    }))
    .sort((left, right) => left.brand.localeCompare(right.brand, 'en') || left.model.localeCompare(right.model, 'en'));
}

export function searchLaptopModelGroups(groups, query, limit = 24) {
  const rawTokens = searchTokens(query);
  if (!rawTokens.length) return [];
  const hasLaptopIntent = rawTokens.includes('لپتاپ')
    || (rawTokens.includes('لپ') && rawTokens.includes('تاپ'));
  const tokens = meaningfulSearchTerms(query).filter(token => !LAPTOP_CATALOG_TERMS.has(token));
  if (!tokens.length) return hasLaptopIntent ? (groups || []).slice(0, limit) : [];
  return (groups || []).filter(group => {
    const haystack = normalizeSearchText([
      group.brand,
      group.model,
      group.name,
      ...group.units.flatMap(unit => [unit.cpu, unit.ram, unit.storage, unit.secondaryStorage, unit.gpu, unit.screen]),
    ].filter(Boolean).join(' ')).toLocaleLowerCase('fa-IR');
    return tokens.every(token => haystack.includes(token));
  }).slice(0, limit);
}

export function laptopConditionLabel(value) {
  return {
    excellent: 'عالی',
    very_good: 'خیلی خوب',
    good: 'خوب',
    fair: 'متوسط',
  }[value] || value || null;
}
