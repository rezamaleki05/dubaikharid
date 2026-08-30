export function laptopSpecGroupKey(laptop) {
  return [
    laptop.brand,
    laptop.model,
    laptop.cpu,
    laptop.ram,
    laptop.storage,
    laptop.secondaryStorage,
    laptop.gpu,
    laptop.screen,
    laptop.condition,
    laptop.priceToman,
  ]
    .map(value => String(value || '').trim().toLocaleLowerCase('en-US'))
    .join('|');
}

export function duplicateLaptopForm(source) {
  const form = source?.rawSpecs && typeof source.rawSpecs === 'object' ? source.rawSpecs : source || {};
  const { id: _id, reservedOrderId: _reservedOrderId, archivedAt: _archivedAt, ...copyable } = form;
  return {
    ...copyable,
    serial: '',
    internalSku: '',
    stockStatus: 'available',
    dateEntered: '',
  };
}

export function countAvailableLaptopGroups(laptops) {
  const counts = new Map();
  for (const laptop of laptops) {
    if (laptop.status !== 'AVAILABLE' || laptop.archivedAt || laptop.reservedOrderId) continue;
    const key = laptopSpecGroupKey(laptop);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}
