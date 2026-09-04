import 'server-only';

import { prisma } from '@/lib/prisma';
import { productNameApiFields } from '@/lib/productNames';
import {
  publicVariantAxes,
  publicVariantOptions,
  resolveProductCartLineFromData,
} from '@/lib/productCartDomain';
import { getPricingSettings } from '@/lib/settings';

export const PUBLIC_PRODUCT_STATUS = 'active';
export const PUBLIC_PRODUCT_VISIBILITY = Object.freeze({ status: PUBLIC_PRODUCT_STATUS });
export const PUBLIC_PRODUCT_PLACEHOLDER = '/images/product-placeholder.svg';

const PUBLIC_PRODUCT_SELECT = Object.freeze({
  id: true,
  nameFa: true,
  nameEn: true,
  description: true,
  slug: true,
  priceAed: true,
  priceToman: true,
  supplyMode: true,
  weight: true,
  originalLink: true,
  image: true,
  gender: true,
  discountPercent: true,
  hasDiscount: true,
  isBestSeller: true,
  createdAt: true,
  updatedAt: true,
  brand: { select: { id: true, name: true, faName: true } },
  category: { select: { id: true, name: true, query: true } },
  store: { select: { id: true, name: true } },
});

const CATEGORY_ALIASES = Object.freeze({
  clothing: ['clothing', 'fashion', 'لباس', 'پوشاک', 'مد و پوشاک'],
  pants: ['pants', 'trousers', 'شلوار', 'سرهمی'],
  shoes: ['shoes', 'shoe', 'footwear', 'کفش', 'کیف و کفش', 'sports'],
  accessories: ['accessories', 'accessory', 'اکسسوری', 'ساعت و اکسسوری'],
  bags: ['bags', 'bag', 'handbag', 'backpack', 'کیف', 'کوله'],
  watches_glasses: ['watches_glasses', 'watch', 'watches', 'glasses', 'ساعت', 'عینک'],
  wallets_belts: ['wallets_belts', 'wallet', 'belt', 'کیف پول', 'کمربند'],
  mobile: ['mobile', 'phone', 'phones', 'tablet', 'موبایل', 'گوشی', 'تبلت'],
  phones: ['mobile', 'phone', 'phones', 'tablet', 'electronics', 'گوشی', 'موبایل', 'تبلت', 'دیجیتال'],
  electronics: ['electronics', 'electronic', 'digital', 'tech', 'تکنولوژی', 'الکترونیک', 'دیجیتال'],
  beauty_health: ['beauty', 'perfume', 'health', 'pills', 'supplement', 'pharmacy', 'عطر', 'آرایشی', 'مکمل', 'قرص', 'بهداشتی', 'سلامت'],
  beauty: ['beauty', 'perfume', 'عطر', 'آرایشی', 'زیبایی'],
  health: ['health', 'pills', 'supplement', 'pharmacy', 'مکمل', 'قرص', 'بهداشتی', 'سلامت'],
  sportsShoes: ['sports', 'shoes', 'shoe', 'footwear', 'ورزشی', 'اسپورت', 'کفش'],
  acc_tech: ['accessories', 'bags', 'watches_glasses', 'wallets_belts', 'electronics', 'tech', 'اکسسوری', 'ساعت', 'کیف', 'تکنولوژی', 'الکترونیک'],
});

const SCOPE_KEYS = new Set([
  'all', 'men', 'women', 'kids', 'clothing', 'sportsShoes', 'accessories',
  'watches', 'mobile', 'electronics', 'beautyHealth', 'other',
]);
const SORT_KEYS = new Set(['newest', 'price_asc', 'price_desc', 'discount', 'best_sellers']);

function textCondition(value) {
  return [
    { id: value },
    { name: { equals: value, mode: 'insensitive' } },
    { name: { contains: value, mode: 'insensitive' } },
  ];
}

function categoryRelation(aliases) {
  return {
    category: {
      is: {
        OR: aliases.flatMap(value => [
          { id: value },
          { name: { equals: value, mode: 'insensitive' } },
          { name: { contains: value, mode: 'insensitive' } },
          { query: { equals: value, mode: 'insensitive' } },
        ]),
      },
    },
  };
}

function excludedCategoryRelation(aliases) {
  return { NOT: categoryRelation(aliases) };
}

function categoryWhere(category) {
  if (!category || category === 'all') return null;
  const aliases = CATEGORY_ALIASES[category] || [category];
  if (category === 'others') {
    return excludedCategoryRelation([
      ...CATEGORY_ALIASES.phones,
      ...CATEGORY_ALIASES.beauty,
      ...CATEGORY_ALIASES.health,
    ]);
  }
  return categoryRelation(aliases);
}

function scopeWhere(scope) {
  if (scope === 'men' || scope === 'women' || scope === 'kids') {
    return { gender: { equals: scope, mode: 'insensitive' } };
  }
  if (scope === 'clothing' || scope === 'sportsShoes') {
    return { gender: { in: ['men', 'women', 'kids'] } };
  }
  if (scope === 'accessories') {
    return categoryRelation([
      ...CATEGORY_ALIASES.accessories,
      ...CATEGORY_ALIASES.bags,
      ...CATEGORY_ALIASES.watches_glasses,
      ...CATEGORY_ALIASES.wallets_belts,
    ]);
  }
  if (scope === 'watches') return categoryRelation(CATEGORY_ALIASES.watches_glasses);
  if (scope === 'mobile') return categoryRelation(CATEGORY_ALIASES.mobile);
  if (scope === 'electronics') return categoryRelation(CATEGORY_ALIASES.electronics);
  if (scope === 'beautyHealth') return categoryRelation(CATEGORY_ALIASES.beauty_health);
  if (scope === 'other') {
    return {
      AND: [
        { OR: [{ gender: null }, { gender: { notIn: ['men', 'women', 'kids'] } }] },
        excludedCategoryRelation([
          ...CATEGORY_ALIASES.clothing,
          ...CATEGORY_ALIASES.pants,
          ...CATEGORY_ALIASES.shoes,
          ...CATEGORY_ALIASES.accessories,
          ...CATEGORY_ALIASES.bags,
          ...CATEGORY_ALIASES.watches_glasses,
          ...CATEGORY_ALIASES.wallets_belts,
        ]),
      ],
    };
  }
  return null;
}

function brandWhere(values) {
  if (!values.length) return null;
  return {
    brand: {
      is: {
        OR: values.flatMap(value => [
          ...textCondition(value),
          { faName: { equals: value, mode: 'insensitive' } },
        ]),
      },
    },
  };
}

function storeWhere(value) {
  if (!value) return null;
  return { store: { is: { OR: textCondition(value) } } };
}

function searchWhere(search) {
  if (!search) return null;
  return {
    OR: [
      { nameFa: { contains: search, mode: 'insensitive' } },
      { nameEn: { contains: search, mode: 'insensitive' } },
      { brand: { is: { OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { faName: { contains: search, mode: 'insensitive' } },
      ] } } },
      { category: { is: { OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { query: { contains: search, mode: 'insensitive' } },
      ] } } },
      { store: { is: { name: { contains: search, mode: 'insensitive' } } } },
    ],
  };
}

function orderByFor(sort) {
  if (sort === 'price_asc') return [{ priceAed: 'asc' }, { createdAt: 'desc' }];
  if (sort === 'price_desc') return [{ priceAed: 'desc' }, { createdAt: 'desc' }];
  if (sort === 'discount') return [{ discountPercent: 'desc' }, { createdAt: 'desc' }];
  return [{ createdAt: 'desc' }];
}

export function serializePublicProduct(product) {
  const category = product.category?.query || product.category?.name || '';
  return {
    id: product.id,
    productId: product.id,
    product_type: 'iran_inventory',
    ...productNameApiFields(product),
    description: product.description || '',
    slug: product.slug,
    priceAed: product.priceAed == null ? null : Number(product.priceAed),
    priceToman: product.priceToman == null ? null : product.priceToman.toFixed(0),
    supplyMode: product.supplyMode,
    weight: product.weight,
    originalLink: product.originalLink || '',
    link: product.originalLink || '',
    image: product.image || PUBLIC_PRODUCT_PLACEHOLDER,
    gender: product.gender || '',
    discountPercent: product.hasDiscount ? product.discountPercent : 0,
    hasDiscount: product.hasDiscount && product.discountPercent > 0,
    isBestSeller: product.isBestSeller,
    brandId: product.brand?.id || null,
    brand: product.brand?.faName || product.brand?.name || '',
    brandName: product.brand?.name || '',
    categoryId: product.category?.id || null,
    category,
    categoryName: product.category?.name || '',
    storeId: product.store?.id || null,
    store: product.store?.name || 'فروشگاه دبی',
    spec: product.category?.name || '',
  };
}

export function normalizePublicCatalogOptions(options = {}) {
  const page = Number(options.page || 1);
  const limit = Number(options.limit || 24);
  if (options.scope && !SCOPE_KEYS.has(options.scope)) throw new Error('INVALID_FILTER');
  if (options.sort && !SORT_KEYS.has(options.sort)) throw new Error('INVALID_FILTER');
  const scope = SCOPE_KEYS.has(options.scope) ? options.scope : 'all';
  const sort = SORT_KEYS.has(options.sort) ? options.sort : 'newest';
  return {
    page: Number.isSafeInteger(page) && page >= 1 && page <= 1_000_000 ? page : null,
    limit: Number.isSafeInteger(limit) && limit >= 1 && limit <= 60 ? limit : null,
    scope,
    sort,
    category: typeof options.category === 'string' ? options.category.trim().slice(0, 120) : '',
    brands: Array.isArray(options.brands)
      ? options.brands.filter(value => typeof value === 'string' && value.trim()).map(value => value.trim().slice(0, 120)).slice(0, 20)
      : [],
    store: typeof options.store === 'string' ? options.store.trim().slice(0, 120) : '',
    search: typeof options.search === 'string' ? options.search.trim().slice(0, 160) : '',
    sale: options.sale === true,
    bestSeller: options.bestSeller === true || sort === 'best_sellers',
  };
}

function publicProductWhere(options, { includeBrand = true } = {}) {
  const clauses = [
    scopeWhere(options.scope),
    categoryWhere(options.category),
    includeBrand ? brandWhere(options.brands) : null,
    storeWhere(options.store),
    searchWhere(options.search),
    options.sale ? { hasDiscount: true, discountPercent: { gt: 0 } } : null,
    options.bestSeller ? { isBestSeller: true } : null,
  ].filter(Boolean);
  return { ...PUBLIC_PRODUCT_VISIBILITY, ...(clauses.length ? { AND: clauses } : {}) };
}

export async function getPublicCatalog(rawOptions = {}) {
  const options = normalizePublicCatalogOptions(rawOptions);
  if (!options.page || !options.limit) throw new Error('INVALID_PAGINATION');
  const where = publicProductWhere(options);
  const facetWhere = publicProductWhere(options, { includeBrand: false });
  const skip = (options.page - 1) * options.limit;

  const [products, total, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      select: PUBLIC_PRODUCT_SELECT,
      orderBy: orderByFor(options.sort),
      skip,
      take: options.limit,
    }),
    prisma.product.count({ where }),
    prisma.brand.findMany({
      where: { products: { some: facetWhere } },
      select: { id: true, name: true, faName: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    data: products.map(serializePublicProduct),
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / options.limit)),
    },
    filters: {
      brands: brands.map(brand => ({ ...brand, displayName: brand.faName || brand.name })),
    },
  };
}

export async function getPublicProduct(identifier) {
  if (typeof identifier !== 'string' || !identifier || identifier.length > 180) return null;
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }], ...PUBLIC_PRODUCT_VISIBILITY },
    select: {
      ...PUBLIC_PRODUCT_SELECT,
      brand: { select: { id: true, name: true, faName: true, showInBrandDirectory: true } },
      category: {
        select: {
          id: true,
          name: true,
          query: true,
          _count: {
            select: {
              attributeAssignments: {
                where: { isVariantDefining: true, attribute: { isActive: true } },
              },
            },
          },
        },
      },
      variants: {
        where: { isActive: true },
        orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          sku: true,
          optionSignature: true,
          isDefault: true,
          isActive: true,
          sortOrder: true,
          priceAedOverride: true,
          priceTomanOverride: true,
          discountPercentOverride: true,
          weightOverride: true,
          options: {
            orderBy: { attribute: { code: 'asc' } },
            select: {
              attributeId: true,
              attributeOptionId: true,
              attribute: { select: { id: true, code: true, nameFa: true, nameEn: true, sortOrder: true } },
              attributeOption: { select: { id: true, code: true, labelFa: true, labelEn: true, swatchHex: true, sortOrder: true } },
            },
          },
          inventory: { select: { stock: true, reserved: true } },
        },
      },
    },
  });
  if (!product) return null;
  const variantAxes = publicVariantAxes(product.variants);
  const variantAxisCount = product.category?._count?.attributeAssignments || 0;
  const settings = product.supplyMode === 'EXTERNAL_DUBAI' ? await getPricingSettings() : null;
  const resolutionProduct = { ...product, variantAxisCount };
  const variants = product.variants.map(variant => {
    const line = resolveProductCartLineFromData({
      product: resolutionProduct,
      line: { productVariantId: variant.id, quantity: 1, requestKey: null },
      settings,
    });
    return {
      id: variant.id,
      sku: variant.sku || null,
      optionSignature: variant.optionSignature,
      isDefault: variant.isDefault,
      options: publicVariantOptions(variant),
      pricing: line.pricing,
      inventory: line.inventory,
      available: line.available,
      unavailableCode: line.code,
    };
  });
  const defaultVariant = variantAxisCount === 0 && variantAxes.length === 0 && variants.length === 1 && variants[0].isDefault
    ? variants[0]
    : null;
  return {
    ...serializePublicProduct(product),
    brandVisible: product.brand?.showInBrandDirectory === true,
    variantAxes,
    variants,
    requiresVariantSelection: variantAxisCount > 0 || variantAxes.length > 0,
    productVariantId: defaultVariant?.id || null,
    variant: defaultVariant || null,
    inStock: defaultVariant ? defaultVariant.available : variants.some(variant => variant.available),
  };
}

export async function getPublicDiscovery({ search = '', category = '', limit = 60 } = {}) {
  const cleanSearch = typeof search === 'string' ? search.trim().slice(0, 160) : '';
  const cleanCategory = typeof category === 'string' ? category.trim().slice(0, 160) : '';
  const take = Number.isSafeInteger(Number(limit)) && Number(limit) >= 1 && Number(limit) <= 100 ? Number(limit) : 60;
  const brandClauses = [
    cleanCategory ? { OR: [
      { cat: { equals: cleanCategory, mode: 'insensitive' } },
      { categoryMappings: { some: { category: { OR: [
        { id: cleanCategory },
        { name: { equals: cleanCategory, mode: 'insensitive' } },
        { query: { equals: cleanCategory, mode: 'insensitive' } },
      ] } } } },
    ] } : null,
    cleanSearch ? { OR: [
      { name: { contains: cleanSearch, mode: 'insensitive' } },
      { faName: { contains: cleanSearch, mode: 'insensitive' } },
      { cat: { contains: cleanSearch, mode: 'insensitive' } },
    ] } : null,
  ].filter(Boolean);
  const brandWhereClause = {
    showInBrandDirectory: true,
    ...(brandClauses.length ? { AND: brandClauses } : {}),
  };
  const storeWhereClause = cleanSearch ? { OR: [
    { name: { contains: cleanSearch, mode: 'insensitive' } },
    { desc: { contains: cleanSearch, mode: 'insensitive' } },
  ] } : {};
  const categoryWhereClause = cleanSearch ? { OR: [
    { name: { contains: cleanSearch, mode: 'insensitive' } },
    { query: { contains: cleanSearch, mode: 'insensitive' } },
  ] } : {};

  const [brands, stores, categories] = await Promise.all([
    prisma.brand.findMany({
      where: brandWhereClause,
      select: {
        id: true, name: true, faName: true, cat: true, url: true, img: true, fallback: true, hasImage: true,
        categoryMappings: {
          select: { category: { select: { id: true, name: true, query: true } } },
          orderBy: { category: { name: 'asc' } },
        },
      },
      orderBy: { name: 'asc' },
      take,
    }),
    prisma.store.findMany({
      where: storeWhereClause,
      select: { id: true, name: true, desc: true, url: true, img: true, fallback: true, hasImage: true },
      orderBy: { name: 'asc' },
      take,
    }),
    prisma.category.findMany({
      where: categoryWhereClause,
      select: { id: true, name: true, icon: true, query: true, countText: true },
      orderBy: { name: 'asc' },
      take,
    }),
  ]);
  return {
    brands: brands.map(({ categoryMappings, ...brand }) => ({
      ...brand,
      categories: categoryMappings.map(mapping => mapping.category),
    })),
    stores,
    categories,
  };
}
