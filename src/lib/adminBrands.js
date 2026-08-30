const BRAND_FIELDS = new Set([
  'id', 'name', 'faName', 'cat', 'hasImage', 'img', 'fallback', 'url',
  'showInBrandDirectory', 'categoryIds', 'quickCreate',
  'supportsLaptop',
]);

function cleanOptionalText(value, maxLength) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim().replace(/\s+/g, ' ');
  if (!cleaned || cleaned.length > maxLength) return undefined;
  return cleaned;
}

function cleanOptionalUrl(value) {
  const cleaned = cleanOptionalText(value, 2048);
  if (cleaned === null) return null;
  if (!cleaned) return undefined;
  try {
    const parsed = new URL(cleaned);
    return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function cleanOptionalImage(value) {
  const cleaned = cleanOptionalText(value, 2048);
  if (cleaned === null) return null;
  if (!cleaned) return undefined;
  if (cleaned.startsWith('/') && !cleaned.startsWith('//')) return cleaned;
  return cleanOptionalUrl(cleaned);
}

export function normalizeBrandName(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function brandNameLookupKey(value) {
  return normalizeBrandName(value).normalize('NFKC').toLocaleLowerCase('en-US');
}

export function resolveBrandCreateVisibility({ quickCreate = false, requestedVisibility } = {}) {
  return quickCreate ? false : (requestedVisibility ?? true);
}

export function validateAdminEntityId(value, label = 'شناسه') {
  const cleaned = cleanOptionalText(value, 128);
  if (!cleaned || !/^[A-Za-z0-9_-]+$/.test(cleaned)) return { error: `${label} معتبر نیست.` };
  return { value: cleaned };
}

export function validateCategoryIds(value) {
  if (value === undefined) return { value: undefined };
  if (!Array.isArray(value) || value.length > 100) {
    return { error: 'فهرست دسته‌بندی‌های برند معتبر نیست.' };
  }
  const ids = [];
  for (const candidate of value) {
    const validated = validateAdminEntityId(candidate, 'شناسه دسته‌بندی');
    if (validated.error) return validated;
    if (!ids.includes(validated.value)) ids.push(validated.value);
  }
  return { value: ids };
}

function validateBrandPayload(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'بدنه درخواست معتبر نیست.' };
  }
  if (Object.keys(body).some(key => !BRAND_FIELDS.has(key))) {
    return { error: 'فیلد غیرمجاز برای برند ارسال شده است.' };
  }

  const data = {};
  if (!partial || Object.hasOwn(body, 'name')) {
    const name = normalizeBrandName(body.name);
    if (!name || name.length > 160) return { error: 'نام برند الزامی و حداکثر ۱۶۰ کاراکتر است.' };
    data.name = name;
  }

  if (!partial && Object.hasOwn(body, 'id')) {
    const id = cleanOptionalText(body.id, 128);
    if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) return { error: 'شناسه برند معتبر نیست.' };
    data.id = id;
  }

  const textFields = [
    ['faName', 160, 'نام نمایشی برند معتبر نیست.'],
    ['cat', 160, 'دسته‌بندی نمایشی برند معتبر نیست.'],
    ['fallback', 32, 'متن جایگزین لوگوی برند معتبر نیست.'],
  ];
  for (const [field, limit, error] of textFields) {
    if (!partial || Object.hasOwn(body, field)) {
      const value = cleanOptionalText(body[field], limit);
      if (body[field] && !value) return { error };
      data[field] = value;
    }
  }

  if (!partial || Object.hasOwn(body, 'url')) {
    const url = cleanOptionalUrl(body.url);
    if (body.url && !url) return { error: 'آدرس وب‌سایت برند معتبر نیست.' };
    data.url = url;
  }
  if (!partial || Object.hasOwn(body, 'img')) {
    const img = cleanOptionalImage(body.img);
    if (body.img && !img) return { error: 'آدرس لوگوی برند معتبر نیست.' };
    data.img = img;
  }
  if (!partial || Object.hasOwn(body, 'hasImage')) {
    if (Object.hasOwn(body, 'hasImage') && typeof body.hasImage !== 'boolean') {
      return { error: 'وضعیت لوگوی برند معتبر نیست.' };
    }
    data.hasImage = Boolean(data.img && (body.hasImage ?? true));
  }
  if (Object.hasOwn(body, 'showInBrandDirectory')) {
    if (typeof body.showInBrandDirectory !== 'boolean') {
      return { error: 'وضعیت نمایش برند معتبر نیست.' };
    }
    data.showInBrandDirectory = body.showInBrandDirectory;
  }
  if (Object.hasOwn(body, 'supportsLaptop')) {
    if (typeof body.supportsLaptop !== 'boolean') return { error: 'قابلیت برند لپ‌تاپ معتبر نیست.' };
    data.supportsLaptop = body.supportsLaptop;
  }
  if (Object.hasOwn(body, 'quickCreate') && body.quickCreate !== true) {
    return { error: 'نوع ایجاد برند معتبر نیست.' };
  }

  const categories = validateCategoryIds(body.categoryIds);
  if (categories.error) return categories;
  if (partial && Object.keys(data).length === 0 && categories.value === undefined) {
    return { error: 'تغییری برای برند ارسال نشده است.' };
  }

  return { data, categoryIds: categories.value, quickCreate: body.quickCreate === true };
}

export function validateBrandCreatePayload(body) {
  return validateBrandPayload(body);
}

export function validateBrandUpdatePayload(body) {
  return validateBrandPayload(body, { partial: true });
}
