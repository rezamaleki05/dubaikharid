const BRAND_FIELDS = new Set(['id', 'name', 'faName', 'cat', 'hasImage', 'img', 'fallback', 'url']);

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

export function validateBrandCreatePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'بدنه درخواست معتبر نیست.' };
  }
  if (Object.keys(body).some(key => !BRAND_FIELDS.has(key))) {
    return { error: 'فیلد غیرمجاز برای برند ارسال شده است.' };
  }

  const name = normalizeBrandName(body.name);
  if (!name || name.length > 160) return { error: 'نام برند الزامی و حداکثر ۱۶۰ کاراکتر است.' };

  const id = cleanOptionalText(body.id, 128);
  if (id && !/^[A-Za-z0-9_-]+$/.test(id)) return { error: 'شناسه برند معتبر نیست.' };
  if (body.id && !id) return { error: 'شناسه برند معتبر نیست.' };

  const faName = cleanOptionalText(body.faName, 160);
  const cat = cleanOptionalText(body.cat, 160);
  const fallback = cleanOptionalText(body.fallback, 32);
  const url = cleanOptionalUrl(body.url);
  const img = cleanOptionalImage(body.img);
  if (body.faName && !faName) return { error: 'نام نمایشی برند معتبر نیست.' };
  if (body.cat && !cat) return { error: 'دسته‌بندی برند معتبر نیست.' };
  if (body.url && !url) return { error: 'آدرس وب‌سایت برند معتبر نیست.' };
  if (body.img && !img) return { error: 'آدرس لوگوی برند معتبر نیست.' };
  if (Object.hasOwn(body, 'hasImage') && typeof body.hasImage !== 'boolean') {
    return { error: 'وضعیت لوگوی برند معتبر نیست.' };
  }

  return {
    data: {
      ...(id ? { id } : {}),
      name,
      faName,
      cat,
      url,
      img,
      fallback,
      hasImage: Boolean(img && (body.hasImage ?? true)),
    },
  };
}
