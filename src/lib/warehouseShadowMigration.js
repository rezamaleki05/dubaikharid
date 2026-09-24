import { createHash } from 'node:crypto';

import { normalizeProductImageUrl } from './productGallery.js';
import { resolveProductVariantPriceFromData } from './productSupplyPricingDomain.js';
import { normalizeProductVariantSku } from './productVariantDomain.js';
import { getWarehouseUnitPriceToman } from './warehouseSales.js';

export const WAREHOUSE_SHADOW_SOURCE_PREFIX = 'warehouse-shadow:';
export const WAREHOUSE_SHADOW_PRODUCT_STATUS = 'hidden';
export const WAREHOUSE_SHADOW_VARIANT_SIGNATURE = '__default__';

const PRODUCT_IMAGE_LIMIT = 10;
const LAPTOP_WAREHOUSE_PATTERN = /(?:لپ[\s‌-]*تاپ|laptop|notebook|macbook|thinkpad|latitude|precision|elitebook|probook|zenbook|vivobook|surface[\s-]*laptop|\bxps\b)/iu;
const LAPTOP_ACCESSORY_PATTERN = /(?:کیف|کاور|پایه|شارژر|آداپتور|داک|باتری|کیبورد|محافظ|case|sleeve|bag|stand|charger|adapter|dock|battery|keyboard|protector)/iu;

const shadowProductInclude = Object.freeze({
  images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }] },
  variants: {
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    include: {
      inventory: {
        include: {
          reservations: { select: { id: true }, take: 1 },
          movements: { select: { id: true }, take: 1 },
        },
      },
      options: { select: { variantId: true }, take: 1 },
    },
  },
});

const warehouseSourceInclude = Object.freeze({
  brand: { select: { id: true, name: true, faName: true } },
  category: { select: { id: true, name: true, query: true } },
  images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }] },
  product: { include: shadowProductInclude },
});

function conflict(source, code, message, details = null) {
  return {
    warehouseItemId: source.id,
    sku: source.sku || null,
    code,
    message,
    ...(details ? { details } : {}),
  };
}

function normalizedRequiredText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function decimalText(value) {
  if (value === null || value === undefined) return null;
  return typeof value?.toFixed === 'function' ? value.toFixed(0) : String(value);
}

function normalizedImageRows(source) {
  return [...(source.images || [])]
    .sort((left, right) => left.sortOrder - right.sortOrder
      || new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime()
      || String(left.id).localeCompare(String(right.id)))
    .map(image => ({
      url: image.url,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary === true,
      blobPathname: null,
      altFa: source.name,
      altEn: source.publicNameEn,
    }));
}

export function warehouseShadowSourceKey(warehouseItemId) {
  return `${WAREHOUSE_SHADOW_SOURCE_PREFIX}${warehouseItemId}`;
}

export function warehouseShadowStableIdentity(warehouseItemId) {
  const digest = createHash('sha256').update(String(warehouseItemId)).digest('hex');
  return {
    code: `WHS_${digest.slice(0, 16).toUpperCase()}`,
    slug: `warehouse-shadow-${digest.slice(0, 24)}`,
  };
}

export function buildWarehouseShadowExpected(source) {
  const errors = [];
  const nameFa = normalizedRequiredText(source.name);
  const nameEn = normalizedRequiredText(source.publicNameEn);
  const stock = Number(source.stock);
  const reserved = Number(source.reserved);
  const minStock = Number(source.minStock);
  const price = Number(source.price);
  const discountPercent = Number(source.discountPercent);

  if (source.categoryKey === 'laptop'
    || (LAPTOP_WAREHOUSE_PATTERN.test(String(source.name || ''))
      && !LAPTOP_ACCESSORY_PATTERN.test(String(source.name || '')))) {
    errors.push(conflict(source, 'LAPTOP_OUT_OF_SCOPE', 'Laptop inventory is explicitly outside the Warehouse shadow migration.'));
  }

  if (!nameFa) errors.push(conflict(source, 'MISSING_NAME', 'Warehouse item has no usable Persian product name.'));
  if (!nameEn) errors.push(conflict(source, 'MISSING_ENGLISH_NAME', 'Warehouse item has no usable English product name.'));
  if (!source.categoryId || !source.category) errors.push(conflict(source, 'MISSING_CATEGORY', 'Warehouse item has no exact Category relation.'));
  if (!source.brandId || !source.brand) errors.push(conflict(source, 'MISSING_BRAND', 'Warehouse item has no exact Brand relation.'));
  if (!Number.isSafeInteger(stock) || stock < 0 || !Number.isSafeInteger(reserved) || reserved < 0) {
    errors.push(conflict(source, 'INVALID_INVENTORY', 'Warehouse stock and reserved counters must be nonnegative safe integers.'));
  } else if (stock < reserved) {
    errors.push(conflict(source, 'STOCK_BELOW_RESERVED', 'Warehouse stock is lower than reserved quantity.', { stock, reserved }));
  }
  if (!Number.isSafeInteger(minStock) || minStock < 0) {
    errors.push(conflict(source, 'INVALID_MINIMUM_STOCK', 'Warehouse minimum stock must be a nonnegative safe integer.'));
  }
  if (!Number.isSafeInteger(price) || price <= 0) {
    errors.push(conflict(source, 'INVALID_PRICE', 'Warehouse price must be a positive whole-Toman safe integer.'));
  }
  if (!Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    errors.push(conflict(source, 'INVALID_DISCOUNT', 'Warehouse discount must be an integer from 0 to 100.'));
  }

  const sku = normalizeProductVariantSku(source.sku);
  if (sku.error) errors.push(conflict(source, 'INVALID_SKU', sku.error));

  const images = normalizedImageRows(source);
  if (images.length > PRODUCT_IMAGE_LIMIT) {
    errors.push(conflict(source, 'IMAGE_LIMIT', `Warehouse gallery exceeds the Product limit of ${PRODUCT_IMAGE_LIMIT} images.`));
  }
  if (new Set(images.map(image => image.url)).size !== images.length) {
    errors.push(conflict(source, 'DUPLICATE_IMAGE', 'Warehouse gallery contains duplicate image URLs.'));
  }
  if (images.filter(image => image.isPrimary).length > 1) {
    errors.push(conflict(source, 'MULTIPLE_PRIMARY_IMAGES', 'Warehouse gallery contains multiple primary images.'));
  }
  for (const image of images) {
    if (!normalizeProductImageUrl(image.url)) {
      errors.push(conflict(source, 'INVALID_IMAGE_URL', 'Warehouse gallery contains an image URL unsupported by ProductImage.'));
      break;
    }
  }
  if (source.image && !normalizeProductImageUrl(source.image)) {
    errors.push(conflict(source, 'INVALID_LEGACY_IMAGE_URL', 'Warehouse legacy cover URL is unsupported by Product.'));
  }

  if (errors.length) return { errors };

  const identity = warehouseShadowStableIdentity(source.id);
  const product = {
    code: identity.code,
    name: nameFa,
    nameFa,
    nameEn,
    description: source.description || null,
    slug: identity.slug,
    brandId: source.brandId,
    categoryId: source.categoryId,
    priceAed: null,
    priceToman: String(price),
    supplyMode: 'IRAN_STOCK',
    weight: 1,
    originalLink: null,
    sourceUrlKey: warehouseShadowSourceKey(source.id),
    image: source.image || null,
    gender: source.gender || null,
    discountPercent,
    hasDiscount: source.hasDiscount === true,
    isBestSeller: source.isBestSeller === true,
    status: WAREHOUSE_SHADOW_PRODUCT_STATUS,
  };
  const variant = {
    sku: sku.value,
    optionSignature: WAREHOUSE_SHADOW_VARIANT_SIGNATURE,
    isDefault: true,
    isActive: false,
    sortOrder: 0,
    priceAedOverride: null,
    priceTomanOverride: null,
    discountPercentOverride: null,
    weightOverride: null,
  };
  const inventory = {
    stock,
    reserved,
    minStock,
    location: source.location || null,
  };
  const legacyFinalPrice = getWarehouseUnitPriceToman(source);
  const productFinalPrice = Number(resolveProductVariantPriceFromData({ product, variant }).finalPriceToman);
  if (legacyFinalPrice !== productFinalPrice) {
    return { errors: [conflict(source, 'PRICE_PARITY_FAILURE', 'Warehouse and Product authoritative final prices do not match.')] };
  }

  return {
    expected: {
      sourceKey: product.sourceUrlKey,
      product,
      variant,
      inventory,
      images,
      parity: {
        finalPriceToman: productFinalPrice,
        available: stock - reserved,
      },
    },
  };
}

function equivalentTarget(target, expected) {
  if (!target) return false;
  const productFields = [
    'code', 'name', 'nameFa', 'nameEn', 'description', 'slug', 'brandId', 'categoryId',
    'supplyMode', 'weight', 'originalLink', 'sourceUrlKey', 'image', 'gender',
    'discountPercent', 'hasDiscount', 'isBestSeller', 'status',
  ];
  if (productFields.some(field => (target[field] ?? null) !== (expected.product[field] ?? null))) return false;
  if (target.priceAed !== null || decimalText(target.priceToman) !== expected.product.priceToman) return false;
  if (target.variants?.length !== 1) return false;
  const variant = target.variants[0];
  const variantFields = [
    'sku', 'optionSignature', 'isDefault', 'isActive', 'sortOrder',
    'priceAedOverride', 'priceTomanOverride', 'discountPercentOverride', 'weightOverride',
  ];
  if (variantFields.some(field => (variant[field] ?? null) !== (expected.variant[field] ?? null))) return false;
  if (variant.options?.length) return false;
  if (!variant.inventory) return false;
  for (const field of ['stock', 'reserved', 'minStock', 'location']) {
    if ((variant.inventory[field] ?? null) !== (expected.inventory[field] ?? null)) return false;
  }
  if (variant.inventory.reservations?.length || variant.inventory.movements?.length) return false;
  if (target.images?.length !== expected.images.length) return false;
  return expected.images.every((image, index) => {
    const actual = target.images[index];
    return actual.url === image.url
      && actual.sortOrder === image.sortOrder
      && actual.isPrimary === image.isPrimary
      && actual.blobPathname === null
      && (actual.altFa ?? null) === (image.altFa ?? null)
      && (actual.altEn ?? null) === (image.altEn ?? null);
  });
}

export function buildWarehouseShadowPlan({ sources, targets = [], skuOwners = [] }) {
  const targetsBySourceKey = new Map(targets.map(target => [target.sourceUrlKey, target]));
  const skuOwnerBySku = new Map(skuOwners
    .filter(row => row.sku)
    .map(row => [String(row.sku).trim().toUpperCase(), row]));
  const create = [];
  const alreadyMigrated = [];
  const conflicts = [];

  for (const source of sources) {
    const built = buildWarehouseShadowExpected(source);
    if (built.errors) {
      conflicts.push(...built.errors);
      continue;
    }
    const expected = built.expected;
    const markerTarget = targetsBySourceKey.get(expected.sourceKey) || null;
    const linkedTarget = source.product || null;

    if (linkedTarget && linkedTarget.sourceUrlKey !== expected.sourceKey) {
      conflicts.push(conflict(source, 'SOURCE_ALREADY_LINKED', 'Warehouse item is linked to a Product not owned by this migration.', { productId: linkedTarget.id }));
      continue;
    }
    if (!linkedTarget && markerTarget) {
      conflicts.push(conflict(source, 'ORPHAN_SHADOW_TARGET', 'A migration-owned Product exists but the Warehouse source is not linked to it.', { productId: markerTarget.id }));
      continue;
    }

    const target = linkedTarget || markerTarget;
    if (target) {
      if (!equivalentTarget(target, expected)) {
        conflicts.push(conflict(source, 'ALREADY_MIGRATED_MISMATCH', 'Existing migration-owned target no longer matches the Warehouse snapshot.', { productId: target.id }));
        continue;
      }
      alreadyMigrated.push({ warehouseItemId: source.id, productId: target.id, sourceKey: expected.sourceKey });
      continue;
    }

    if (expected.variant.sku) {
      const owner = skuOwnerBySku.get(expected.variant.sku);
      if (owner) {
        conflicts.push(conflict(source, 'DUPLICATE_SKU', 'Warehouse SKU is already owned by another ProductVariant.', { productVariantId: owner.id }));
        continue;
      }
    }
    create.push({ source, expected });
  }

  return { sources, create, alreadyMigrated, conflicts };
}

export function summarizeWarehouseShadowPlan(plan) {
  const conflictedItems = new Set(plan.conflicts.map(item => item.warehouseItemId));
  return {
    warehouseItemsScanned: plan.sources.length,
    eligibleItems: plan.create.length + plan.alreadyMigrated.length,
    alreadyMigrated: plan.alreadyMigrated.length,
    conflicts: conflictedItems.size,
    productsToCreate: plan.create.length,
    variantsToCreate: plan.create.length,
    inventoriesToCreate: plan.create.length,
    imagesToCreate: plan.create.reduce((sum, item) => sum + item.expected.images.length, 0),
    skippedItems: conflictedItems.size,
    conflictDetails: plan.conflicts,
  };
}

export async function inspectWarehouseShadowMigration(client) {
  const sources = await client.warehouseItem.findMany({
    orderBy: { id: 'asc' },
    include: warehouseSourceInclude,
  });
  const targets = await client.product.findMany({
    where: { sourceUrlKey: { startsWith: WAREHOUSE_SHADOW_SOURCE_PREFIX } },
    orderBy: { id: 'asc' },
    include: shadowProductInclude,
  });
  const skuOwners = await client.productVariant.findMany({
    where: { sku: { not: null } },
    select: { id: true, productId: true, sku: true },
  });
  return buildWarehouseShadowPlan({ sources, targets, skuOwners });
}

async function createShadowTarget(tx, row) {
  const product = await tx.product.create({ data: row.expected.product });
  const variant = await tx.productVariant.create({
    data: { productId: product.id, ...row.expected.variant },
  });
  await tx.productInventory.create({
    data: { variantId: variant.id, ...row.expected.inventory },
  });
  if (row.expected.images.length) {
    await tx.productImage.createMany({
      data: row.expected.images.map(image => ({ productId: product.id, ...image })),
    });
  }
  const linked = await tx.warehouseItem.updateMany({
    where: { id: row.source.id, productId: null },
    data: { productId: product.id },
  });
  if (linked.count !== 1) throw new Error(`Warehouse source changed during migration: ${row.source.id}`);
  return { product, variant };
}

export async function runWarehouseShadowMigration(client, { dryRun = true } = {}) {
  const preflightPlan = await inspectWarehouseShadowMigration(client);
  const preflight = summarizeWarehouseShadowPlan(preflightPlan);
  if (dryRun) {
    return {
      dryRun: true,
      preflight,
      created: { products: 0, variants: 0, inventories: 0, images: 0 },
    };
  }

  const applied = await client.$transaction(async tx => {
    const currentPlan = await inspectWarehouseShadowMigration(tx);
    const created = { products: 0, variants: 0, inventories: 0, images: 0 };
    for (const row of currentPlan.create) {
      await createShadowTarget(tx, row);
      created.products += 1;
      created.variants += 1;
      created.inventories += 1;
      created.images += row.expected.images.length;
    }
    return { created, conflicts: currentPlan.conflicts };
  }, { isolationLevel: 'Serializable', maxWait: 10_000, timeout: 60_000 });

  const finalPlan = await inspectWarehouseShadowMigration(client);
  return {
    dryRun: false,
    preflight,
    created: applied.created,
    applyConflicts: applied.conflicts,
    final: summarizeWarehouseShadowPlan(finalPlan),
  };
}
