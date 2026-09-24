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
