import {
  buildWarehouseShadowExpected,
  WAREHOUSE_SHADOW_PRODUCT_STATUS,
  WAREHOUSE_SHADOW_SOURCE_PREFIX,
  WAREHOUSE_SHADOW_VARIANT_SIGNATURE,
  warehouseShadowSourceKey,
} from './warehouseShadowMigration.js';

export const WAREHOUSE_CUTOVER_PRODUCT_STATUS = 'active';
export const WAREHOUSE_CUTOVER_MOVEMENT_PREFIX = 'warehouse-cutover:';
export const WAREHOUSE_CUTOVER_ROLLBACK_POLICY = Object.freeze({
  automated: false,
  requirements: Object.freeze([
    'no Product OrderItem exists',
    'no ProductInventoryReservation exists',
    'no post-cutover ProductInventoryMovement exists beyond the reconciliation movement',
    'no Product-facing sale or fulfillment occurred',
  ]),
});

export const warehouseCutoverMappingSelect = Object.freeze({
  id: true,
  productId: true,
  isPublished: true,
  isArchived: true,
  product: {
    select: {
      id: true,
      sourceUrlKey: true,
      supplyMode: true,
      status: true,
      variants: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          isDefault: true,
          isActive: true,
          optionSignature: true,
          inventory: { select: { id: true } },
          options: { select: { variantId: true }, take: 1 },
        },
      },
    },
  },
});

const TERMINAL_WAREHOUSE_ORDER_STATUSES = new Set(['cancelled', 'delivered']);
const RESOLUTION_MOVEMENT_TYPES = new Set(['ORDER_RELEASE', 'ORDER_FULFILLMENT']);
const MAX_SERIALIZABLE_RETRIES = 3;

const cutoverProductInclude = Object.freeze({
  images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }] },
  variants: {
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    include: {
      inventory: {
        include: {
          reservations: { select: { id: true }, take: 1 },
          movements: { select: { id: true, idempotencyKey: true }, take: 2 },
        },
      },
      options: { select: { variantId: true }, take: 1 },
      _count: { select: { orderItems: true } },
    },
  },
  _count: { select: { orderItems: true } },
});

const cutoverWarehouseInclude = Object.freeze({
  brand: { select: { id: true, name: true, faName: true } },
  category: { select: { id: true, name: true, query: true } },
  images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }] },
  product: { include: cutoverProductInclude },
  orderItems: {
    select: {
      id: true,
      orderId: true,
      order: { select: { id: true, type: true, status: true, orderCode: true } },
    },
  },
  movements: {
    where: { orderId: { not: null }, type: { in: ['ORDER_RESERVATION', 'ORDER_RELEASE', 'ORDER_FULFILLMENT'] } },
    select: { orderId: true, type: true },
  },
});

function issue(source, code, message, details = null) {
  return {
    warehouseItemId: source.id,
    productId: source.productId || null,
    sku: source.sku || null,
    code,
    message,
    ...(details ? { details } : {}),
  };
}

function decimalText(value) {
  if (value === null || value === undefined) return null;
  return typeof value?.toFixed === 'function' ? value.toFixed(0) : String(value);
}

function sameValue(actual, expected) {
  return (actual ?? null) === (expected ?? null);
}

function sameProductImages(actual = [], expected = []) {
  if (actual.length !== expected.length) return false;
  return expected.every((image, index) => {
    const row = actual[index];
    return row?.url === image.url
      && row?.sortOrder === image.sortOrder
      && row?.isPrimary === image.isPrimary
      && row?.blobPathname === null
      && (row?.altFa ?? null) === (image.altFa ?? null)
      && (row?.altEn ?? null) === (image.altEn ?? null);
  });
}

export function getWarehouseCutoverMappingFromData(source) {
  const product = source?.product;
  if (!source || !product || source.productId !== product.id) return null;
  if (product.sourceUrlKey !== warehouseShadowSourceKey(source.id)) return null;
  if (product.supplyMode !== 'IRAN_STOCK' || product.status !== WAREHOUSE_CUTOVER_PRODUCT_STATUS) return null;
  if (source.isPublished || source.isArchived) return null;
  if (product.variants?.length !== 1) return null;
  const variant = product.variants[0];
  if (!variant.isDefault || variant.optionSignature !== WAREHOUSE_SHADOW_VARIANT_SIGNATURE || !variant.isActive) return null;
  if (variant.options?.length || !variant.inventory) return null;
  return {
    warehouseItemId: source.id,
    productId: product.id,
    productVariantId: variant.id,
  };
}

export function isWarehouseCutoverLocked(source) {
  const product = source?.product;
  return Boolean(
    source
    && product
    && source.productId === product.id
    && product.sourceUrlKey === warehouseShadowSourceKey(source.id)
    && product.status === WAREHOUSE_CUTOVER_PRODUCT_STATUS,
  );
}

export async function findWarehouseCutoverMappings(client, warehouseItemIds) {
  const ids = [...new Set((warehouseItemIds || []).filter(Boolean))];
  if (!ids.length) return new Map();
  const sources = await client.warehouseItem.findMany({
    where: { id: { in: ids } },
    select: warehouseCutoverMappingSelect,
  });
  return new Map(sources.flatMap(source => {
    const mapping = getWarehouseCutoverMappingFromData(source);
    return mapping ? [[source.id, mapping]] : [];
  }));
}

function unresolvedWarehouseOrders(source) {
  const resolved = new Set((source.movements || [])
    .filter(row => RESOLUTION_MOVEMENT_TYPES.has(row.type) && row.orderId)
    .map(row => row.orderId));
  const unresolved = new Map();
  for (const item of source.orderItems || []) {
    const order = item.order;
    if (!order || TERMINAL_WAREHOUSE_ORDER_STATUSES.has(order.status) || resolved.has(order.id)) continue;
    unresolved.set(order.id, { id: order.id, orderCode: order.orderCode, status: order.status, type: order.type });
  }
  return [...unresolved.values()];
}

function reconciliationFields(source, expected) {
  const fields = [];
  const product = source.product;
  const variant = product.variants[0];
  const inventory = variant.inventory;
  const productFields = [
    'name', 'nameFa', 'nameEn', 'description', 'brandId', 'categoryId', 'priceAed',
    'weight', 'originalLink', 'image', 'gender', 'discountPercent', 'hasDiscount', 'isBestSeller',
  ];
  for (const field of productFields) {
    if (!sameValue(product[field], expected.product[field])) fields.push(`product.${field}`);
  }
  if (decimalText(product.priceToman) !== expected.product.priceToman) fields.push('product.priceToman');
  for (const field of ['sku', 'priceAedOverride', 'priceTomanOverride', 'discountPercentOverride', 'weightOverride']) {
    if (!sameValue(variant[field], expected.variant[field])) fields.push(`variant.${field}`);
  }
  for (const field of ['stock', 'reserved', 'minStock', 'location']) {
    if (!sameValue(inventory[field], expected.inventory[field])) fields.push(`inventory.${field}`);
  }
  if (!sameProductImages(product.images, expected.images)) fields.push('product.images');
  return fields;
}

export function buildWarehouseCutoverCandidate(source, { skuOwners = [] } = {}) {
  if (!source.productId) {
    return { blocked: [issue(source, 'SHADOW_LINK_MISSING', 'Warehouse item has no linked shadow Product.')] };
  }
  const product = source.product;
  if (!product) {
    return { blocked: [issue(source, 'LINKED_PRODUCT_NOT_FOUND', 'Linked shadow Product does not exist.')] };
  }
  if (product.sourceUrlKey !== warehouseShadowSourceKey(source.id)) {
    return { blocked: [issue(source, 'SOURCE_LINK_MISMATCH', 'Linked Product is not owned by this Warehouse shadow migration.')] };
  }
  if (product.supplyMode !== 'IRAN_STOCK') {
    return { blocked: [issue(source, 'INVALID_SUPPLY_MODE', 'Linked Product is not IRAN_STOCK.')] };
  }
  if (product.variants?.length !== 1) {
    return { blocked: [issue(source, 'DEFAULT_VARIANT_MISMATCH', 'Linked Product must have exactly one shadow Variant.')] };
  }
  const variant = product.variants[0];
  if (!variant.isDefault || variant.optionSignature !== WAREHOUSE_SHADOW_VARIANT_SIGNATURE || variant.options?.length) {
    return { blocked: [issue(source, 'DEFAULT_VARIANT_MISMATCH', 'Linked Product does not have the expected option-free default Variant.')] };
  }
  if (!variant.inventory) {
    return { blocked: [issue(source, 'SHADOW_INVENTORY_MISSING', 'Shadow ProductInventory does not exist.')] };
  }

  const alreadyMapping = getWarehouseCutoverMappingFromData(source);
  if (alreadyMapping) return { alreadyCutOver: alreadyMapping };

  const cleanPreCutoverState = source.isPublished === true
    && source.isArchived === false
    && product.status === WAREHOUSE_SHADOW_PRODUCT_STATUS
    && variant.isActive === false;
  if (!cleanPreCutoverState) {
    return { blocked: [issue(source, 'CUTOVER_STATE_MISMATCH', 'Warehouse/Product publication state is partially or inconsistently cut over.', {
      warehousePublished: source.isPublished,
      warehouseArchived: source.isArchived,
      productStatus: product.status,
      variantActive: variant.isActive,
    })] };
  }
  if (source.reserved > 0) {
    return { blocked: [issue(source, 'ACTIVE_WAREHOUSE_RESERVATION', 'Warehouse reserved quantity must be zero before cutover.', { reserved: source.reserved })] };
  }
  const unresolvedOrders = unresolvedWarehouseOrders(source);
  if (unresolvedOrders.length) {
    return { blocked: [issue(source, 'IN_FLIGHT_WAREHOUSE_ORDER', 'An unresolved Warehouse Order can still mutate this source inventory.', { orders: unresolvedOrders })] };
  }
  if (variant.inventory.reservations?.length || variant.inventory.movements?.length || product._count?.orderItems || variant._count?.orderItems) {
    return { blocked: [issue(source, 'SHADOW_PRODUCT_ACTIVITY', 'Shadow Product already has Product-side inventory or Order activity.')] };
  }

  const built = buildWarehouseShadowExpected(source);
  if (built.errors) return { blocked: built.errors.map(row => issue(source, row.code, row.message, row.details || null)) };
  const expected = {
    ...built.expected,
    product: { ...built.expected.product, status: WAREHOUSE_CUTOVER_PRODUCT_STATUS },
    variant: { ...built.expected.variant, isActive: true },
    inventory: { ...built.expected.inventory, reserved: 0 },
  };
  if (expected.variant.sku) {
    const normalizedSku = expected.variant.sku.toUpperCase();
    const conflictingOwner = skuOwners.find(owner => owner.sku?.trim().toUpperCase() === normalizedSku && owner.id !== variant.id);
    if (conflictingOwner) {
      return { blocked: [issue(source, 'DUPLICATE_SKU', 'Warehouse SKU belongs to another ProductVariant.', { productVariantId: conflictingOwner.id })] };
    }
  }
  return {
    eligible: {
      warehouseItemId: source.id,
      productId: product.id,
      productVariantId: variant.id,
      inventoryId: variant.inventory.id,
      expected,
      reconciliationFields: reconciliationFields(source, expected),
    },
  };
}

export function buildWarehouseCutoverPlan({ sources, skuOwners = [] }) {
  const eligible = [];
  const alreadyCutOver = [];
  const blocked = [];
  for (const source of sources) {
    const candidate = buildWarehouseCutoverCandidate(source, { skuOwners });
    if (candidate.eligible) eligible.push(candidate.eligible);
    if (candidate.alreadyCutOver) alreadyCutOver.push(candidate.alreadyCutOver);
    if (candidate.blocked) blocked.push(...candidate.blocked);
  }
  return { sources, eligible, alreadyCutOver, blocked };
}

export function summarizeWarehouseCutoverPlan(plan) {
  const blockedSources = new Set(plan.blocked.map(row => row.warehouseItemId));
  const reservationSources = new Set(plan.blocked.filter(row => row.code === 'ACTIVE_WAREHOUSE_RESERVATION').map(row => row.warehouseItemId));
  const reconciliationSources = plan.eligible.filter(row => row.reconciliationFields.length > 0);
  return {
    linkedShadowsScanned: plan.sources.length,
    eligible: plan.eligible.length,
    blockedReservations: reservationSources.size,
    reconciliationRequired: reconciliationSources.length,
    conflicts: blockedSources.size,
    alreadyCutOver: plan.alreadyCutOver.length,
    wouldActivate: plan.eligible.length,
    wouldDepublishWarehouse: plan.eligible.length,
    reconciliationDetails: reconciliationSources.map(row => ({
      warehouseItemId: row.warehouseItemId,
      fields: row.reconciliationFields,
    })),
    conflictDetails: plan.blocked,
  };
}

export async function inspectWarehouseProductCutover(client, { warehouseItemId = null } = {}) {
  const sources = await client.warehouseItem.findMany({
    where: warehouseItemId ? { id: warehouseItemId } : { productId: { not: null } },
    orderBy: { id: 'asc' },
    include: cutoverWarehouseInclude,
  });
  const skuOwners = await client.productVariant.findMany({
    where: { sku: { not: null } },
    select: { id: true, productId: true, sku: true },
  });
  return buildWarehouseCutoverPlan({ sources, skuOwners });
}

function retryable(error) {
  return error?.code === 'P2034'
    || error?.cause?.kind === 'TransactionWriteConflict'
    || error?.cause?.originalCode === '40001';
}

async function serializable(client, operation) {
  let lastError;
  for (let attempt = 0; attempt < MAX_SERIALIZABLE_RETRIES; attempt += 1) {
    try {
      return await client.$transaction(operation, { isolationLevel: 'Serializable', maxWait: 10_000, timeout: 60_000 });
    } catch (error) {
      lastError = error;
      if (!retryable(error) || attempt === MAX_SERIALIZABLE_RETRIES - 1) throw error;
    }
  }
  throw lastError;
}

async function applyEligibleCutover(tx, row) {
  const source = await tx.warehouseItem.findUnique({ where: { id: row.warehouseItemId }, include: cutoverWarehouseInclude });
  if (!source) throw new Error(`Warehouse source disappeared during cutover: ${row.warehouseItemId}`);
  const skuOwners = await tx.productVariant.findMany({ where: { sku: { not: null } }, select: { id: true, productId: true, sku: true } });
  const current = buildWarehouseCutoverCandidate(source, { skuOwners });
  if (!current.eligible) return { applied: false, alreadyCutOver: current.alreadyCutOver || null, blocked: current.blocked || [] };
  const eligible = current.eligible;
  const { expected } = eligible;
  const inventory = source.product.variants[0].inventory;

  await tx.product.update({ where: { id: eligible.productId }, data: expected.product });
  await tx.productVariant.update({ where: { id: eligible.productVariantId }, data: expected.variant });
  if (inventory.stock !== expected.inventory.stock || inventory.reserved !== 0) {
    await tx.productInventoryMovement.create({ data: {
      inventoryId: inventory.id,
      type: 'ADJUSTMENT',
      quantity: expected.inventory.stock - inventory.stock,
      stockBefore: inventory.stock,
      stockAfter: expected.inventory.stock,
      reservedBefore: inventory.reserved,
      reservedAfter: 0,
      reason: `Warehouse cutover reconciliation for ${source.id}`,
      idempotencyKey: `${WAREHOUSE_CUTOVER_MOVEMENT_PREFIX}${source.id}:reconciliation`,
    } });
  }
  await tx.productInventory.update({ where: { id: inventory.id }, data: expected.inventory });
  await tx.productImage.deleteMany({ where: { productId: eligible.productId } });
  if (expected.images.length) {
    await tx.productImage.createMany({ data: expected.images.map(image => ({ productId: eligible.productId, ...image })) });
  }
  const depublished = await tx.warehouseItem.updateMany({
    where: {
      id: source.id,
      productId: eligible.productId,
      isPublished: true,
      isArchived: false,
      reserved: 0,
      updatedAt: source.updatedAt,
    },
    data: { isPublished: false, publishedAt: null },
  });
  if (depublished.count !== 1) throw new Error(`Warehouse source changed during cutover: ${source.id}`);
  return { applied: true, eligible };
}

export async function runWarehouseProductCutover(client, { dryRun = true, warehouseItemId = null } = {}) {
  const preflightPlan = await inspectWarehouseProductCutover(client, { warehouseItemId });
  const preflight = summarizeWarehouseCutoverPlan(preflightPlan);
  if (dryRun) return { dryRun: true, preflight, applied: 0 };

  const results = [];
  for (const row of preflightPlan.eligible) {
    results.push(await serializable(client, tx => applyEligibleCutover(tx, row)));
  }
  const finalPlan = await inspectWarehouseProductCutover(client, { warehouseItemId });
  return {
    dryRun: false,
    preflight,
    applied: results.filter(result => result.applied).length,
    applyBlocked: results.flatMap(result => result.blocked || []),
    final: summarizeWarehouseCutoverPlan(finalPlan),
  };
}

export { cutoverProductInclude, cutoverWarehouseInclude, WAREHOUSE_SHADOW_SOURCE_PREFIX };
