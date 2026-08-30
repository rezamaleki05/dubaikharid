export function getWarehouseAvailableQuantity(item) {
  return Math.max(0, Number(item?.stock || 0) - Number(item?.reserved || 0));
}

export function getWarehouseUnitPriceToman(item) {
  const price = Number(item?.price || 0);
  const discount = item?.hasDiscount ? Number(item.discountPercent || 0) : 0;
  return discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
}

export function getOrderItemSource(item) {
  const sources = [
    item?.productId ? 'product' : null,
    item?.laptopId ? 'laptop' : null,
    item?.warehouseItemId ? 'warehouse' : null,
  ].filter(Boolean);
  return sources.length === 1 ? sources[0] : null;
}

export function reserveWarehouseQuantity(item, quantity) {
  const amount = Number(quantity);
  if (!Number.isSafeInteger(amount) || amount < 1 || getWarehouseAvailableQuantity(item) < amount) return null;
  return { stock: Number(item.stock), reserved: Number(item.reserved) + amount };
}

export function releaseWarehouseQuantity(item, quantity) {
  const amount = Number(quantity);
  if (!Number.isSafeInteger(amount) || amount < 1 || Number(item?.reserved || 0) < amount) return null;
  return { stock: Number(item.stock), reserved: Number(item.reserved) - amount };
}

export function fulfillWarehouseQuantity(item, quantity) {
  const amount = Number(quantity);
  if (!Number.isSafeInteger(amount) || amount < 1 || Number(item?.reserved || 0) < amount || Number(item?.stock || 0) < amount) return null;
  return { stock: Number(item.stock) - amount, reserved: Number(item.reserved) - amount };
}
