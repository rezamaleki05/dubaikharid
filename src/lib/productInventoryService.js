import 'server-only';

import {
  deriveProductInventoryState,
  ProductInventoryError,
} from '@/lib/productInventoryDomain';

const MAX_SERIALIZABLE_RETRIES = 3;

const inventoryVariantSelect = Object.freeze({
  id: true,
  productId: true,
  isActive: true,
  optionSignature: true,
  product: { select: { id: true, supplyMode: true } },
});

function conflict(message, code) {
  return new ProductInventoryError(message, 409, code);
}

function notFound(message, code) {
  return new ProductInventoryError(message, 404, code);
}

function concurrentUpdate() {
  return conflict('موجودی هم‌زمان تغییر کرد؛ دوباره تلاش کنید.', 'PRODUCT_INVENTORY_CONCURRENT_UPDATE');
}

function isRetryable(error, retryUnique) {
  return error?.code === 'P2034'
    || error?.code === 'PRODUCT_INVENTORY_CONCURRENT_UPDATE'
    || error?.cause?.kind === 'TransactionWriteConflict'
    || error?.cause?.originalCode === '40001'
    || (retryUnique && error?.code === 'P2002');
}

export async function runSerializableWithRetry(client, operation, { retryUnique = false, timeout = 5_000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < MAX_SERIALIZABLE_RETRIES; attempt += 1) {
    try {
      return await client.$transaction(operation, { isolationLevel: 'Serializable', timeout });
    } catch (error) {
      lastError = error;
      if (!isRetryable(error, retryUnique) || attempt === MAX_SERIALIZABLE_RETRIES - 1) throw error;
    }
  }
  throw lastError;
}

function assertPositiveInteger(value, label = 'تعداد') {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new ProductInventoryError(`${label} باید عدد صحیح بزرگ‌تر از صفر باشد.`);
  }
}

function assertNonnegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ProductInventoryError(`${label} باید عدد صحیح نامنفی باشد.`);
  }
}

function assertKey(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 160) {
    throw new ProductInventoryError(`${label} معتبر نیست.`);
  }
  return value.trim();
}

function serializeInventory(inventory) {
  if (!inventory) return null;
  return {
    id: inventory.id,
    variantId: inventory.variantId,
    ...deriveProductInventoryState(inventory),
    createdAt: inventory.createdAt?.toISOString?.() ?? inventory.createdAt,
    updatedAt: inventory.updatedAt?.toISOString?.() ?? inventory.updatedAt,
  };
}

function serializeReservation(reservation) {
  return {
    id: reservation.id,
    inventoryId: reservation.inventoryId,
    reservationKey: reservation.reservationKey,
    quantity: reservation.quantity,
    status: reservation.status,
    orderId: reservation.orderId ?? null,
    orderItemId: reservation.orderItemId ?? null,
    expiresAt: reservation.expiresAt?.toISOString?.() ?? null,
    releasedAt: reservation.releasedAt?.toISOString?.() ?? null,
    fulfilledAt: reservation.fulfilledAt?.toISOString?.() ?? null,
    createdAt: reservation.createdAt?.toISOString?.() ?? reservation.createdAt,
    updatedAt: reservation.updatedAt?.toISOString?.() ?? reservation.updatedAt,
    inventory: reservation.inventory ? serializeInventory(reservation.inventory) : undefined,
  };
}

function serializeMovement(movement) {
  return {
    id: movement.id,
    inventoryId: movement.inventoryId,
    reservationId: movement.reservationId,
    type: movement.type,
    quantity: movement.quantity,
    stockBefore: movement.stockBefore,
    stockAfter: movement.stockAfter,
    reservedBefore: movement.reservedBefore,
    reservedAfter: movement.reservedAfter,
    reason: movement.reason,
    idempotencyKey: movement.idempotencyKey,
    adminId: movement.adminId,
    createdAt: movement.createdAt?.toISOString?.() ?? movement.createdAt,
  };
}

async function loadEligibleVariant(client, variantId, { requireActive = true } = {}) {
  const variant = await client.productVariant.findUnique({ where: { id: variantId }, select: inventoryVariantSelect });
  if (!variant) throw notFound('تنوع محصول پیدا نشد.', 'VARIANT_NOT_FOUND');
  if (variant.product.supplyMode !== 'IRAN_STOCK') {
    throw conflict('موجودی فیزیکی فقط برای محصول موجود در ایران مجاز است.', 'PRODUCT_INVENTORY_NOT_APPLICABLE');
  }
  if (requireActive && !variant.isActive) {
    throw conflict('برای تنوع غیرفعال نمی‌توان موجودی را مدیریت کرد.', 'VARIANT_INACTIVE');
  }
  return variant;
}

async function loadEligibleInventory(client, inventoryId) {
  const inventory = await client.productInventory.findUnique({
    where: { id: inventoryId },
    include: { variant: { select: inventoryVariantSelect } },
  });
  if (!inventory) throw notFound('موجودی تنوع پیدا نشد.', 'PRODUCT_INVENTORY_NOT_FOUND');
  if (inventory.variant.product.supplyMode !== 'IRAN_STOCK') {
    throw conflict('موجودی فیزیکی برای روش تأمین فعلی قابل مدیریت نیست.', 'PRODUCT_INVENTORY_NOT_APPLICABLE');
  }
  if (!inventory.variant.isActive) throw conflict('تنوع محصول غیرفعال است.', 'VARIANT_INACTIVE');
  return inventory;
}

export async function getProductInventoryByVariant(client, variantId) {
  const variant = await client.productVariant.findUnique({
    where: { id: variantId },
    select: {
      ...inventoryVariantSelect,
      inventory: true,
    },
  });
  if (!variant) throw notFound('تنوع محصول پیدا نشد.', 'VARIANT_NOT_FOUND');
  if (variant.product.supplyMode !== 'IRAN_STOCK') {
    return { applicable: false, supplyMode: variant.product.supplyMode, variantId, initialized: false, inventory: null };
  }
  return {
    applicable: true,
    supplyMode: variant.product.supplyMode,
    variantId,
    initialized: Boolean(variant.inventory),
    inventory: serializeInventory(variant.inventory),
  };
}

export async function initializeProductInventoryInTransaction(
  tx,
  { variantId, stock, minStock = 0, location = null, adminId = null },
) {
  assertNonnegativeInteger(stock, 'موجودی اولیه');
  assertNonnegativeInteger(minStock, 'حداقل موجودی');
  await loadEligibleVariant(tx, variantId);
  const existing = await tx.productInventory.findUnique({ where: { variantId }, select: { id: true } });
  if (existing) throw conflict('موجودی این تنوع قبلاً مقداردهی شده است.', 'PRODUCT_INVENTORY_EXISTS');
  const inventory = await tx.productInventory.create({
    data: { variantId, stock, reserved: 0, minStock, location },
  });
  await tx.productInventoryMovement.create({ data: {
    inventoryId: inventory.id,
    type: 'STOCK_IN',
    quantity: stock,
    stockBefore: 0,
    stockAfter: stock,
    reservedBefore: 0,
    reservedAfter: 0,
    reason: 'مقداردهی اولیه موجودی تنوع',
    idempotencyKey: `initialize:${variantId}`,
    adminId,
  } });
  return serializeInventory(inventory);
}

export async function initializeProductInventory(client, data) {
  try {
    return await runSerializableWithRetry(client, tx => initializeProductInventoryInTransaction(tx, data));
  } catch (error) {
    if (error?.code === 'P2002') throw conflict('موجودی این تنوع قبلاً مقداردهی شده است.', 'PRODUCT_INVENTORY_EXISTS');
    throw error;
  }
}

export async function adjustProductInventoryStockInTransaction(
  tx,
  { inventoryId, delta, reason = null, idempotencyKey, adminId = null },
) {
  if (!Number.isSafeInteger(delta) || delta === 0) throw new ProductInventoryError('تغییر موجودی باید عدد صحیح غیرصفر باشد.');
  const key = assertKey(idempotencyKey, 'کلید تکرارناپذیری');
  const replay = await tx.productInventoryMovement.findUnique({ where: { idempotencyKey: key } });
  if (replay) {
    if (replay.inventoryId !== inventoryId || replay.type !== 'ADJUSTMENT' || replay.quantity !== delta) {
      throw conflict('کلید تکرارناپذیری قبلاً برای عملیات دیگری استفاده شده است.', 'IDEMPOTENCY_KEY_CONFLICT');
    }
    return serializeInventory(await tx.productInventory.findUnique({ where: { id: inventoryId } }));
  }
  const current = await loadEligibleInventory(tx, inventoryId);
  const stockAfter = current.stock + delta;
  if (stockAfter < 0 || stockAfter < current.reserved) {
    throw conflict('این تغییر موجودی باعث کسری موجودی رزروشده می‌شود.', 'INSUFFICIENT_AVAILABLE_STOCK');
  }
  const changed = await tx.productInventory.updateMany({
    where: { id: inventoryId, stock: current.stock, reserved: current.reserved },
    data: { stock: stockAfter },
  });
  if (changed.count !== 1) throw concurrentUpdate();
  await tx.productInventoryMovement.create({ data: {
    inventoryId,
    type: 'ADJUSTMENT',
    quantity: delta,
    stockBefore: current.stock,
    stockAfter,
    reservedBefore: current.reserved,
    reservedAfter: current.reserved,
    reason,
    idempotencyKey: key,
    adminId,
  } });
  return serializeInventory(await tx.productInventory.findUnique({ where: { id: inventoryId } }));
}

export async function adjustProductInventoryStock(client, data) {
  return runSerializableWithRetry(
    client,
    tx => adjustProductInventoryStockInTransaction(tx, data),
    { retryUnique: true },
  );
}

function assertReservationReplay(reservation, line) {
  if (reservation.inventoryId !== line.inventory.id || reservation.quantity !== line.quantity) {
    throw conflict('کلید رزرو قبلاً برای موجودی یا تعداد دیگری استفاده شده است.', 'RESERVATION_KEY_CONFLICT');
  }
}

function normalizeReservationLines(lines) {
  if (!Array.isArray(lines) || lines.length < 1) throw new ProductInventoryError('حداقل یک ردیف رزرو لازم است.');
  const seenVariants = new Set();
  return lines.map(line => {
    assertPositiveInteger(line.quantity);
    const reservationKey = assertKey(line.reservationKey, 'کلید رزرو');
    if (seenVariants.has(line.variantId)) throw new ProductInventoryError('هر تنوع فقط یک بار می‌تواند رزرو شود.');
    seenVariants.add(line.variantId);
    return { ...line, reservationKey };
  });
}

export async function reserveProductInventoryLinesInTransaction(
  tx,
  { lines, expiresAt = null, adminId = null },
) {
  const normalizedLines = normalizeReservationLines(lines);
  const variants = await tx.productVariant.findMany({
    where: { id: { in: normalizedLines.map(line => line.variantId) } },
    select: { ...inventoryVariantSelect, inventory: true },
  });
  if (variants.length !== normalizedLines.length) throw notFound('یک یا چند تنوع محصول پیدا نشد.', 'VARIANT_NOT_FOUND');
  const byId = new Map(variants.map(variant => [variant.id, variant]));
  const resolved = normalizedLines.map(line => {
    const variant = byId.get(line.variantId);
    if (variant.product.supplyMode !== 'IRAN_STOCK') {
      throw conflict('موجودی فیزیکی فقط برای محصول موجود در ایران مجاز است.', 'PRODUCT_INVENTORY_NOT_APPLICABLE');
    }
    if (!variant.isActive) throw conflict('تنوع محصول غیرفعال است.', 'VARIANT_INACTIVE');
    if (!variant.inventory) throw notFound('موجودی تنوع مقداردهی نشده است.', 'PRODUCT_INVENTORY_NOT_FOUND');
    return { ...line, inventory: variant.inventory };
  }).sort((left, right) => left.inventory.id.localeCompare(right.inventory.id));

  const existingRows = await tx.productInventoryReservation.findMany({
    where: { reservationKey: { in: resolved.map(line => line.reservationKey) } },
    include: { inventory: true },
  });
  const existingByKey = new Map(existingRows.map(row => [row.reservationKey, row]));
  const reservations = [];
  for (const line of resolved) {
    const replay = existingByKey.get(line.reservationKey);
    if (replay) {
      assertReservationReplay(replay, line);
      reservations.push(replay);
      continue;
    }
    const current = await tx.productInventory.findUnique({ where: { id: line.inventory.id } });
    if (!current || current.stock - current.reserved < line.quantity) {
      throw conflict('موجودی قابل رزرو کافی نیست.', 'INSUFFICIENT_STOCK');
    }
    const reservedAfter = current.reserved + line.quantity;
    const changed = await tx.productInventory.updateMany({
      where: { id: current.id, stock: current.stock, reserved: current.reserved },
      data: { reserved: reservedAfter },
    });
    if (changed.count !== 1) throw concurrentUpdate();
    const reservation = await tx.productInventoryReservation.create({ data: {
      inventoryId: current.id,
      reservationKey: line.reservationKey,
      quantity: line.quantity,
      status: 'ACTIVE',
      expiresAt,
    } });
    await tx.productInventoryMovement.create({ data: {
      inventoryId: current.id,
      reservationId: reservation.id,
      type: 'ORDER_RESERVATION',
      quantity: line.quantity,
      stockBefore: current.stock,
      stockAfter: current.stock,
      reservedBefore: current.reserved,
      reservedAfter,
      reason: `رزرو موجودی ${line.reservationKey}`,
      idempotencyKey: `reserve:${line.reservationKey}`,
      adminId,
    } });
    reservations.push({ ...reservation, inventory: { ...current, reserved: reservedAfter } });
  }
  return reservations.map(serializeReservation);
}

export async function reserveProductInventoryLines(client, input) {
  return runSerializableWithRetry(
    client,
    tx => reserveProductInventoryLinesInTransaction(tx, input),
    { retryUnique: true },
  );
}

export async function reserveProductInventory(client, input) {
  const [reservation] = await reserveProductInventoryLines(client, { ...input, lines: [input] });
  return reservation;
}

export async function transitionProductInventoryReservationInTransaction(
  tx,
  { reservationKey, targetStatus, adminId = null },
) {
  const key = assertKey(reservationKey, 'کلید رزرو');
  const isRelease = targetStatus === 'RELEASED';
  if (!['RELEASED', 'FULFILLED'].includes(targetStatus)) {
    throw new ProductInventoryError('وضعیت نهایی رزرو معتبر نیست.');
  }
  const reservation = await tx.productInventoryReservation.findUnique({
    where: { reservationKey: key },
    include: { inventory: { include: { variant: { select: inventoryVariantSelect } } } },
  });
  if (!reservation) throw notFound('رزرو موجودی پیدا نشد.', 'PRODUCT_INVENTORY_RESERVATION_NOT_FOUND');
  if (reservation.status === targetStatus) return serializeReservation(reservation);
  if (reservation.status !== 'ACTIVE') {
    throw conflict(
      isRelease ? 'رزرو انجام‌شده قابل آزادسازی نیست.' : 'رزرو آزادشده قابل نهایی‌سازی نیست.',
      'INVALID_RESERVATION_TRANSITION',
    );
  }
  const current = reservation.inventory;
  if (current.reserved < reservation.quantity || (!isRelease && current.stock < reservation.quantity)) {
    throw conflict('شمارنده‌های موجودی رزرو ناسازگار است.', 'PRODUCT_INVENTORY_STATE_CONFLICT');
  }
  const stockAfter = isRelease ? current.stock : current.stock - reservation.quantity;
  const reservedAfter = current.reserved - reservation.quantity;
  const transitioned = await tx.productInventoryReservation.updateMany({
    where: { id: reservation.id, status: 'ACTIVE' },
    data: isRelease
      ? { status: 'RELEASED', releasedAt: new Date() }
      : { status: 'FULFILLED', fulfilledAt: new Date() },
  });
  if (transitioned.count !== 1) throw concurrentUpdate();
  const changed = await tx.productInventory.updateMany({
    where: { id: current.id, stock: current.stock, reserved: current.reserved },
    data: { stock: stockAfter, reserved: reservedAfter },
  });
  if (changed.count !== 1) throw concurrentUpdate();
  await tx.productInventoryMovement.create({ data: {
    inventoryId: current.id,
    reservationId: reservation.id,
    type: isRelease ? 'ORDER_RELEASE' : 'ORDER_FULFILLMENT',
    quantity: reservation.quantity,
    stockBefore: current.stock,
    stockAfter,
    reservedBefore: current.reserved,
    reservedAfter,
    reason: `${isRelease ? 'آزادسازی' : 'نهایی‌سازی'} رزرو ${key}`,
    idempotencyKey: `${isRelease ? 'release' : 'fulfill'}:${key}`,
    adminId,
  } });
  return serializeReservation(await tx.productInventoryReservation.findUnique({
    where: { id: reservation.id },
    include: { inventory: true },
  }));
}

async function transitionReservation(client, input) {
  return runSerializableWithRetry(
    client,
    tx => transitionProductInventoryReservationInTransaction(tx, input),
    { retryUnique: true },
  );
}

export function releaseProductInventoryReservation(client, input) {
  return transitionReservation(client, { ...input, targetStatus: 'RELEASED' });
}

export function fulfillProductInventoryReservation(client, input) {
  return transitionReservation(client, { ...input, targetStatus: 'FULFILLED' });
}

export async function returnProductInventory(client, { inventoryId, quantity, reason = null, idempotencyKey, adminId = null }) {
  assertPositiveInteger(quantity, 'تعداد مرجوعی');
  const key = assertKey(idempotencyKey, 'کلید تکرارناپذیری');
  return runSerializableWithRetry(client, async tx => {
    const replay = await tx.productInventoryMovement.findUnique({ where: { idempotencyKey: key } });
    if (replay) {
      if (replay.inventoryId !== inventoryId || replay.type !== 'RETURN' || replay.quantity !== quantity) {
        throw conflict('کلید تکرارناپذیری قبلاً برای عملیات دیگری استفاده شده است.', 'IDEMPOTENCY_KEY_CONFLICT');
      }
      return serializeInventory(await tx.productInventory.findUnique({ where: { id: inventoryId } }));
    }
    const current = await loadEligibleInventory(tx, inventoryId);
    const stockAfter = current.stock + quantity;
    const changed = await tx.productInventory.updateMany({
      where: { id: inventoryId, stock: current.stock, reserved: current.reserved },
      data: { stock: stockAfter },
    });
    if (changed.count !== 1) throw concurrentUpdate();
    await tx.productInventoryMovement.create({ data: {
      inventoryId,
      type: 'RETURN',
      quantity,
      stockBefore: current.stock,
      stockAfter,
      reservedBefore: current.reserved,
      reservedAfter: current.reserved,
      reason,
      idempotencyKey: key,
      adminId,
    } });
    return serializeInventory(await tx.productInventory.findUnique({ where: { id: inventoryId } }));
  }, { retryUnique: true });
}

export async function releaseExpiredProductInventoryReservations(
  client,
  now = new Date(),
  { adminId = null, reservationKeys = null } = {},
) {
  const expired = await client.productInventoryReservation.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lte: now },
      ...(reservationKeys ? { reservationKey: { in: reservationKeys } } : {}),
    },
    select: { reservationKey: true },
    orderBy: [{ expiresAt: 'asc' }, { reservationKey: 'asc' }],
  });
  const released = [];
  for (const row of expired) {
    released.push(await releaseProductInventoryReservation(client, { reservationKey: row.reservationKey, adminId }));
  }
  return released;
}

export async function listProductInventoryMovements(client, inventoryId, { take = 100 } = {}) {
  if (!await client.productInventory.findUnique({ where: { id: inventoryId }, select: { id: true } })) {
    throw notFound('موجودی تنوع پیدا نشد.', 'PRODUCT_INVENTORY_NOT_FOUND');
  }
  const movements = await client.productInventoryMovement.findMany({
    where: { inventoryId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: Math.min(Math.max(Number(take) || 100, 1), 200),
  });
  return movements.map(serializeMovement);
}

export async function listProductInventoryReservations(client, inventoryId, { status = null, take = 100 } = {}) {
  if (!await client.productInventory.findUnique({ where: { id: inventoryId }, select: { id: true } })) {
    throw notFound('موجودی تنوع پیدا نشد.', 'PRODUCT_INVENTORY_NOT_FOUND');
  }
  const reservations = await client.productInventoryReservation.findMany({
    where: { inventoryId, ...(status ? { status } : {}) },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: Math.min(Math.max(Number(take) || 100, 1), 200),
  });
  return reservations.map(serializeReservation);
}
