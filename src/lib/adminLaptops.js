import 'server-only';

import { Prisma } from '@/generated/prisma/client';

export const LAPTOP_STATUSES = Object.freeze(['AVAILABLE', 'RESERVED', 'SOLD', 'INACTIVE']);
export const LAPTOP_STATUS_SET = new Set(LAPTOP_STATUSES);

const PHYSICAL_STATUSES = new Set(['excellent', 'very_good', 'good', 'fair']);
const HARDWARE_TEST_KEYS = ['keyboard', 'speaker', 'display', 'usb', 'battery', 'wifi', 'camera', 'charge'];
const ACCESSORY_KEYS = ['charger', 'box'];
const URL_PROTOCOLS = new Set(['http:', 'https:']);

export class LaptopDomainError extends Error {
  constructor(message, status = 400, code = 'INVALID_LAPTOP') {
    super(message);
    this.name = 'LaptopDomainError';
    this.status = status;
    this.code = code;
  }
}

export async function assertLaptopCompatibleBrand(client, brandName) {
  const brand = await client.brand.findFirst({
    where: { name: { equals: String(brandName || '').trim(), mode: 'insensitive' }, supportsLaptop: true },
    select: { id: true, name: true },
  });
  if (!brand) throw new LaptopDomainError('برند انتخاب‌شده برای Laptop Stock فعال نیست.', 409, 'LAPTOP_BRAND_REQUIRED');
  return brand;
}

export async function assertLaptopCatalogSelection(client, { brandName, modelName }) {
  const brand = await assertLaptopCompatibleBrand(client, brandName);
  const model = await client.laptopModel.findFirst({
    where: { brandId: brand.id, name: { equals: String(modelName || '').trim(), mode: 'insensitive' }, active: true },
    select: { id: true, name: true },
  });
  if (!model) throw new LaptopDomainError('مدل انتخاب‌شده برای این برند ثبت نشده است.', 409, 'LAPTOP_MODEL_REQUIRED');
  return { brand, model };
}

function hasOwn(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function textValue(value, label, maximum, { required = false } = {}) {
  if (value === null || value === undefined) {
    if (required) throw new LaptopDomainError(`${label} الزامی است.`);
    return null;
  }
  if (typeof value !== 'string') throw new LaptopDomainError(`${label} معتبر نیست.`);
  const valueTrimmed = value.trim();
  if (required && !valueTrimmed) throw new LaptopDomainError(`${label} الزامی است.`);
  if (valueTrimmed.length > maximum) throw new LaptopDomainError(`${label} بیش از حد طولانی است.`);
  return valueTrimmed || null;
}

function decimalValue(value, label, { required = false, maximum = '999999999999999999' } = {}) {
  if (value === '' || value === null || value === undefined) {
    if (required) throw new LaptopDomainError(`${label} الزامی است.`);
    return null;
  }
  const normalized = typeof value === 'number' ? String(value) : String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new LaptopDomainError(`${label} معتبر نیست.`);
  const result = new Prisma.Decimal(normalized);
  if (result.isNegative() || result.greaterThan(maximum)) throw new LaptopDomainError(`${label} خارج از محدوده مجاز است.`);
  return result;
}

function integerValue(value, label, { minimum = 0, maximum = 9999 } = {}) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new LaptopDomainError(`${label} معتبر نیست.`);
  }
  return number;
}

function booleanMap(value, keys, label) {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new LaptopDomainError(`${label} معتبر نیست.`);
  return Object.fromEntries(keys.map(key => [key, Boolean(value[key])]));
}

function imageUrl(value, label) {
  const normalized = textValue(value, label, 2048);
  if (!normalized) return null;
  if (normalized.startsWith('/')) return normalized;
  try {
    const parsed = new URL(normalized);
    if (!URL_PROTOCOLS.has(parsed.protocol)) throw new Error('protocol');
    return parsed.toString();
  } catch {
    throw new LaptopDomainError(`${label} باید آدرس معتبر http یا https باشد.`);
  }
}

function imageList(value) {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value) || value.length > 12) throw new LaptopDomainError('فهرست تصاویر معتبر نیست.');
  return value.map((item, index) => imageUrl(item, `تصویر ${index + 1}`)).filter(Boolean);
}

function splitStorage(storageSize, storageType) {
  const size = textValue(storageSize, 'حجم حافظه', 32);
  const type = textValue(storageType, 'نوع حافظه', 32);
  return [size, type].filter(Boolean).join(' ') || null;
}

function parseStorage(storage) {
  const match = String(storage || '').match(/^\s*([\d.]+)\s*(.*)$/);
  return { size: match?.[1] || '', type: match?.[2]?.trim() || '' };
}

function statusFromClient(value) {
  const normalized = String(value || '').trim();
  const aliases = {
    available: 'AVAILABLE', reserved: 'RESERVED', sold: 'SOLD',
    unavailable: 'INACTIVE', inactive: 'INACTIVE',
  };
  const status = aliases[normalized.toLowerCase()] || normalized.toUpperCase();
  if (!LAPTOP_STATUS_SET.has(status)) throw new LaptopDomainError('وضعیت لپ‌تاپ معتبر نیست.');
  return status;
}

export function statusToClient(status) {
  return { AVAILABLE: 'available', RESERVED: 'reserved', SOLD: 'sold', INACTIVE: 'unavailable' }[status] || 'unavailable';
}

export function validateLaptopPayload(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'بدنه درخواست معتبر نیست.' };
  try {
    const data = {};
    const assignText = (inputKey, dbKey, label, maximum, required = false) => {
      if (hasOwn(body, inputKey)) data[dbKey] = textValue(body[inputKey], label, maximum, { required });
      else if (!partial && required) throw new LaptopDomainError(`${label} الزامی است.`);
    };

    assignText('brand', 'brand', 'برند', 120, true);
    assignText('model', 'model', 'مدل', 180, true);
    assignText('serial', 'serialNumber', 'شماره سریال', 160);
    assignText('internalSku', 'internalSku', 'کد داخلی', 160);
    assignText('cpu', 'cpu', 'پردازنده', 180, true);
    assignText('ram', 'ram', 'رم', 64, true);
    assignText('gpu', 'gpu', 'کارت گرافیک', 180);
    assignText('screenSize', 'screen', 'اندازه نمایشگر', 64);
    assignText('color', 'color', 'رنگ', 80);
    assignText('physicalStatus', 'condition', 'وضعیت ظاهری', 32);
    assignText('customerNotes', 'description', 'توضیحات مشتری', 4000);
    assignText('internalNotes', 'internalNotes', 'یادداشت داخلی', 4000);
    assignText('dateEntered', 'dateEntered', 'تاریخ ورود', 32);
    assignText('warrantyExpiry', 'warrantyExpiry', 'تاریخ پایان گارانتی', 32);
    assignText('lastService', 'lastService', 'تاریخ آخرین سرویس', 32);
    assignText('nextService', 'nextService', 'تاریخ سرویس بعدی', 32);

    if (data.condition && !PHYSICAL_STATUSES.has(data.condition)) throw new LaptopDomainError('وضعیت ظاهری معتبر نیست.');
    if (hasOwn(body, 'storageSize') || hasOwn(body, 'storageType')) {
      data.storage = splitStorage(body.storageSize, body.storageType);
      if (!partial && !data.storage) throw new LaptopDomainError('حافظه اصلی الزامی است.');
    } else if (!partial) throw new LaptopDomainError('حافظه اصلی الزامی است.');
    if (hasOwn(body, 'storage2Size') || hasOwn(body, 'storage2Type')) {
      data.secondaryStorage = body.storage2Type === 'none' ? null : splitStorage(body.storage2Size, body.storage2Type);
    }

    if (hasOwn(body, 'manufactureYear')) data.manufactureYear = integerValue(body.manufactureYear, 'سال ساخت', { minimum: 1980, maximum: new Date().getUTCFullYear() + 1 });
    if (hasOwn(body, 'batteryHealth')) data.batteryHealth = integerValue(body.batteryHealth, 'سلامت باتری', { minimum: 0, maximum: 100 });
    if (hasOwn(body, 'warrantyDays')) data.warrantyDays = integerValue(body.warrantyDays, 'مدت گارانتی', { minimum: 0, maximum: 3650 });
    if (hasOwn(body, 'weight')) data.weightKg = decimalValue(body.weight, 'وزن', { maximum: '99.99' });
    if (hasOwn(body, 'buyingPrice')) data.purchasePriceAed = decimalValue(body.buyingPrice, 'قیمت خرید', { required: !partial, maximum: '9999999999.99' });
    else if (!partial) throw new LaptopDomainError('قیمت خرید الزامی است.');
    if (hasOwn(body, 'extraCosts')) data.extraCostsAed = decimalValue(body.extraCosts, 'هزینه‌های جانبی', { maximum: '9999999999.99' });
    if (hasOwn(body, 'sellingPrice')) data.priceToman = decimalValue(body.sellingPrice, 'قیمت فروش', { required: !partial });
    else if (!partial) throw new LaptopDomainError('قیمت فروش الزامی است.');
    if (hasOwn(body, 'hardwareTests')) data.hardwareTests = booleanMap(body.hardwareTests, HARDWARE_TEST_KEYS, 'تست‌های فنی');
    if (hasOwn(body, 'accessories')) data.accessories = booleanMap(body.accessories, ACCESSORY_KEYS, 'لوازم جانبی');
    if (hasOwn(body, 'images')) {
      data.images = imageList(body.images);
      data.image = data.images[0] || null;
    }
    if (hasOwn(body, 'stockStatus')) data.status = statusFromClient(body.stockStatus);
    else if (hasOwn(body, 'status')) data.status = statusFromClient(body.status);
    else if (!partial) data.status = 'AVAILABLE';

    const brand = data.brand ?? textValue(body.brand, 'برند', 120);
    const model = data.model ?? textValue(body.model, 'مدل', 180);
    if (!partial || hasOwn(body, 'brand') || hasOwn(body, 'model')) {
      if (brand && model) data.name = `لپ‌تاپ استوک ${brand} مدل ${model}`;
    }
    if (partial && Object.keys(data).length === 0) throw new LaptopDomainError('هیچ فیلد معتبری برای به‌روزرسانی ارسال نشده است.');
    return { data };
  } catch (error) {
    if (error instanceof LaptopDomainError) return { error: error.message };
    throw error;
  }
}

export function isValidLaptopId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 160;
}

export function assertLaptopTransition(previousStatus, nextStatus) {
  if (!nextStatus || nextStatus === previousStatus) return;
  const allowed = {
    AVAILABLE: new Set(['RESERVED', 'SOLD', 'INACTIVE']),
    RESERVED: new Set(['AVAILABLE', 'SOLD', 'INACTIVE']),
    INACTIVE: new Set(['AVAILABLE', 'RESERVED']),
    SOLD: new Set(),
  };
  if (!allowed[previousStatus]?.has(nextStatus)) {
    throw new LaptopDomainError('تغییر وضعیت انتخاب‌شده مجاز نیست.', 409, 'INVALID_STATUS_TRANSITION');
  }
}

function decimalString(value, digits = 0) {
  return value === null || value === undefined ? null : new Prisma.Decimal(value).toFixed(digits);
}

function safeObject(value, defaults) {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...defaults, ...value } : defaults;
}

export function serializeLaptop(laptop) {
  const primaryStorage = parseStorage(laptop.storage);
  const secondaryStorage = parseStorage(laptop.secondaryStorage);
  const images = Array.isArray(laptop.images) ? laptop.images.filter(value => typeof value === 'string') : [];
  const image = laptop.image || images[0] || null;
  const buyingPrice = decimalString(laptop.purchasePriceAed, 2) || '0';
  const extraCosts = decimalString(laptop.extraCostsAed, 2) || '0';
  const sellingPrice = decimalString(laptop.priceToman, 0) || '0';
  const hardwareTests = safeObject(laptop.hardwareTests, Object.fromEntries(HARDWARE_TEST_KEYS.map(key => [key, false])));
  const accessories = safeObject(laptop.accessories, Object.fromEntries(ACCESSORY_KEYS.map(key => [key, false])));
  const form = {
    brand: laptop.brand || '', model: laptop.model || '', serial: laptop.serialNumber || '',
    cpu: laptop.cpu || '', ram: String(laptop.ram || '').replace(/\s*GB$/i, ''),
    storageSize: primaryStorage.size, storageType: primaryStorage.type,
    storage2Size: secondaryStorage.size || '0', storage2Type: secondaryStorage.type || 'none',
    gpu: laptop.gpu || '', screenSize: String(laptop.screen || '').replace(/[^\d.]/g, ''),
    manufactureYear: laptop.manufactureYear ? String(laptop.manufactureYear) : '', color: laptop.color || '',
    batteryHealth: laptop.batteryHealth === null ? '' : String(laptop.batteryHealth),
    weight: laptop.weightKg === null ? '' : decimalString(laptop.weightKg, 2).replace(/\.?0+$/, ''),
    buyingPrice, extraCosts, sellingPrice, internalNotes: laptop.internalNotes || '', customerNotes: laptop.description || '',
    hardwareTests, accessories, physicalStatus: PHYSICAL_STATUSES.has(laptop.condition) ? laptop.condition : 'good',
    stockStatus: statusToClient(laptop.status), dateEntered: laptop.dateEntered || '', internalSku: laptop.internalSku || '',
    warrantyDays: laptop.warrantyDays === null ? '' : String(laptop.warrantyDays), warrantyExpiry: laptop.warrantyExpiry || '',
    lastService: laptop.lastService || '', nextService: laptop.nextService || '', images,
  };
  const priceAed = new Prisma.Decimal(buyingPrice).plus(extraCosts).toFixed(2);
  return {
    id: laptop.id, name: laptop.name, brand: laptop.brand || '', model: laptop.model || '', serial: laptop.serialNumber,
    cpu: laptop.cpu, ram: laptop.ram, storage: laptop.storage, gpu: laptop.gpu, screen: laptop.screen,
    condition: laptop.condition, priceToman: sellingPrice, status: laptop.status, stockStatus: statusToClient(laptop.status),
    image, images, description: laptop.description, internalSku: laptop.internalSku, soldAt: laptop.soldAt,
    archivedAt: laptop.archivedAt, createdAt: laptop.createdAt, updatedAt: laptop.updatedAt,
    store: 'انبار ایران', category: 'electronics', product_type: 'laptop_stock', priceAed: Number(priceAed),
    weight: laptop.weightKg === null ? 0 : Number(laptop.weightKg), colors: laptop.color ? [laptop.color] : [],
    sizes: laptop.screen ? [`${laptop.screen} inch`] : [],
    spec: [laptop.ram, laptop.storage, laptop.cpu].filter(Boolean).join(' / '), rawSpecs: form,
  };
}

export function serializePublicLaptop(laptop) {
  const serialized = serializeLaptop(laptop);
  const inStock = laptop.status === 'AVAILABLE' && !laptop.archivedAt && !laptop.reservedOrderId && Number(laptop.priceToman) > 0;
  return {
    id: serialized.id,
    name: serialized.name,
    brand: serialized.brand,
    model: serialized.model,
    cpu: serialized.cpu,
    ram: serialized.ram,
    storage: serialized.storage,
    gpu: serialized.gpu,
    screen: serialized.screen,
    condition: serialized.condition,
    priceToman: serialized.priceToman,
    image: serialized.image || '/images/product-placeholder.svg',
    images: serialized.images,
    description: serialized.description,
    store: serialized.store,
    category: serialized.category,
    product_type: serialized.product_type,
    weight: serialized.weight,
    colors: serialized.colors,
    sizes: serialized.sizes,
    spec: serialized.spec,
    inStock,
    available: inStock,
  };
}
