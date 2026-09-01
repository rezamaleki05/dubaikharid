export const CATALOG_ATTRIBUTE_INPUT_TYPES = Object.freeze([
  'SELECT',
  'MULTI_SELECT',
  'TEXT',
  'NUMBER',
  'BOOLEAN',
  'COLOR',
]);

export const CATALOG_ATTRIBUTE_INPUT_TYPE_SET = new Set(CATALOG_ATTRIBUTE_INPUT_TYPES);
export const VARIANT_ATTRIBUTE_INPUT_TYPES = new Set(['SELECT', 'MULTI_SELECT', 'COLOR']);

const CODE_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const ATTRIBUTE_CODE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const SWATCH_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const DECIMAL_PATTERN = /^-?\d{1,12}(?:\.\d{1,6})?$/;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function strictObject(body, allowed) {
  if (!isObject(body)) return { error: 'بدنه درخواست معتبر نیست.' };
  if (Object.keys(body).some(key => !allowed.has(key))) return { error: 'فیلد غیرمجاز در درخواست وجود دارد.' };
  return null;
}

function cleanRequiredText(value, label, maximum) {
  if (typeof value !== 'string') return { error: `${label} الزامی است.` };
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maximum) return { error: `${label} معتبر نیست.` };
  return { value: cleaned };
}

function cleanOptionalText(value, label, maximum) {
  if (value === null || value === undefined || value === '') return { value: null };
  if (typeof value !== 'string') return { error: `${label} معتبر نیست.` };
  const cleaned = value.trim();
  if (!cleaned) return { value: null };
  return cleaned.length <= maximum ? { value: cleaned } : { error: `${label} معتبر نیست.` };
}

function cleanCode(value, label, pattern) {
  if (typeof value !== 'string') return { error: `${label} الزامی است.` };
  const cleaned = value.trim().toLowerCase();
  return pattern.test(cleaned) ? { value: cleaned } : { error: `${label} معتبر نیست.` };
}

function cleanBoolean(value, label) {
  return typeof value === 'boolean' ? { value } : { error: `${label} معتبر نیست.` };
}

function cleanSortOrder(value) {
  const parsed = value === undefined ? 0 : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 100_000
    ? { value: parsed }
    : { error: 'ترتیب نمایش معتبر نیست.' };
}

export function validateCatalogEntityId(value, label = 'شناسه') {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && ID_PATTERN.test(value)
    ? { value }
    : { error: `${label} معتبر نیست.` };
}

export function validateCatalogAttributePayload(body, { partial = false } = {}) {
  const allowed = new Set(['code', 'nameFa', 'nameEn', 'inputType', 'unitFa', 'unitEn', 'isActive', 'sortOrder']);
  const shapeError = strictObject(body, allowed);
  if (shapeError) return shapeError;
  const data = {};

  for (const [key, label, maximum] of [['nameFa', 'نام فارسی', 160], ['nameEn', 'نام انگلیسی', 160]]) {
    if (!partial || Object.hasOwn(body, key)) {
      const parsed = cleanRequiredText(body[key], label, maximum);
      if (parsed.error) return parsed;
      data[key] = parsed.value;
    }
  }
  if (!partial || Object.hasOwn(body, 'code')) {
    const parsed = cleanCode(body.code, 'کد فنی ویژگی', ATTRIBUTE_CODE_PATTERN);
    if (parsed.error) return parsed;
    data.code = parsed.value;
  }
  if (!partial || Object.hasOwn(body, 'inputType')) {
    if (typeof body.inputType !== 'string' || !CATALOG_ATTRIBUTE_INPUT_TYPE_SET.has(body.inputType)) {
      return { error: 'نوع ورودی ویژگی معتبر نیست.' };
    }
    data.inputType = body.inputType;
  }
  for (const [key, label] of [['unitFa', 'واحد فارسی'], ['unitEn', 'واحد انگلیسی']]) {
    if (Object.hasOwn(body, key)) {
      const parsed = cleanOptionalText(body[key], label, 40);
      if (parsed.error) return parsed;
      data[key] = parsed.value;
    }
  }
  if (Object.hasOwn(body, 'isActive')) {
    const parsed = cleanBoolean(body.isActive, 'وضعیت ویژگی');
    if (parsed.error) return parsed;
    data.isActive = parsed.value;
  } else if (!partial) data.isActive = true;
  if (Object.hasOwn(body, 'sortOrder') || !partial) {
    const parsed = cleanSortOrder(body.sortOrder);
    if (parsed.error) return parsed;
    data.sortOrder = parsed.value;
  }
  if (partial && Object.keys(data).length === 0) return { error: 'تغییری ارسال نشده است.' };
  return { data };
}

export function validateAttributeOptionPayload(body, { partial = false } = {}) {
  const allowed = new Set(['code', 'labelFa', 'labelEn', 'swatchHex', 'sortOrder', 'isActive']);
  const shapeError = strictObject(body, allowed);
  if (shapeError) return shapeError;
  const data = {};

  if (!partial || Object.hasOwn(body, 'code')) {
    const parsed = cleanCode(body.code, 'کد فنی مقدار', CODE_PATTERN);
    if (parsed.error) return parsed;
    data.code = parsed.value;
  }
  for (const [key, label] of [['labelFa', 'برچسب فارسی'], ['labelEn', 'برچسب انگلیسی']]) {
    if (!partial || Object.hasOwn(body, key)) {
      const parsed = cleanRequiredText(body[key], label, 160);
      if (parsed.error) return parsed;
      data[key] = parsed.value;
    }
  }
  if (Object.hasOwn(body, 'swatchHex')) {
    const parsed = cleanOptionalText(body.swatchHex, 'کد رنگ', 7);
    if (parsed.error) return parsed;
    if (parsed.value && !SWATCH_PATTERN.test(parsed.value)) return { error: 'کد رنگ باید مانند #000000 باشد.' };
    data.swatchHex = parsed.value?.toUpperCase() || null;
  }
  if (Object.hasOwn(body, 'isActive')) {
    const parsed = cleanBoolean(body.isActive, 'وضعیت مقدار ویژگی');
    if (parsed.error) return parsed;
    data.isActive = parsed.value;
  } else if (!partial) data.isActive = true;
  if (Object.hasOwn(body, 'sortOrder') || !partial) {
    const parsed = cleanSortOrder(body.sortOrder);
    if (parsed.error) return parsed;
    data.sortOrder = parsed.value;
  }
  if (partial && Object.keys(data).length === 0) return { error: 'تغییری ارسال نشده است.' };
  return { data };
}

export function validateCategoryAttributePayload(body, { partial = false } = {}) {
  const allowed = new Set(['attributeId', 'isRequired', 'isVariantDefining', 'allowsMultiple', 'sortOrder']);
  const shapeError = strictObject(body, allowed);
  if (shapeError) return shapeError;
  const data = {};

  if (!partial || Object.hasOwn(body, 'attributeId')) {
    const parsed = validateCatalogEntityId(body.attributeId, 'شناسه ویژگی');
    if (parsed.error) return parsed;
    data.attributeId = parsed.value;
  }
  for (const [key, label] of [
    ['isRequired', 'وضعیت الزامی بودن'],
    ['isVariantDefining', 'وضعیت سازنده تنوع'],
    ['allowsMultiple', 'وضعیت انتخاب چندگانه'],
  ]) {
    if (Object.hasOwn(body, key)) {
      const parsed = cleanBoolean(body[key], label);
      if (parsed.error) return parsed;
      data[key] = parsed.value;
    } else if (!partial) data[key] = false;
  }
  if (Object.hasOwn(body, 'sortOrder') || !partial) {
    const parsed = cleanSortOrder(body.sortOrder);
    if (parsed.error) return parsed;
    data.sortOrder = parsed.value;
  }
  if (partial && Object.keys(data).length === 0) return { error: 'تغییری ارسال نشده است.' };
  return { data };
}

export function validateCategoryAttributeConfiguration(inputType, configuration) {
  if (configuration.isVariantDefining && !VARIANT_ATTRIBUTE_INPUT_TYPES.has(inputType)) {
    return { error: 'فقط ویژگی‌های انتخابی یا رنگی می‌توانند سازنده تنوع باشند.' };
  }
  if (configuration.allowsMultiple && !['MULTI_SELECT', 'COLOR'].includes(inputType)) {
    return { error: 'انتخاب چندگانه فقط برای MULTI_SELECT یا COLOR مجاز است.' };
  }
  if (inputType === 'MULTI_SELECT' && configuration.allowsMultiple === false) {
    return { error: 'ویژگی MULTI_SELECT باید انتخاب چندگانه را فعال کند.' };
  }
  return { data: configuration };
}

export function normalizeProductAttributeValueInputs(value) {
  if (!Array.isArray(value) || value.length > 200) return { error: 'فهرست مقادیر ویژگی محصول معتبر نیست.' };
  const allowed = new Set(['attributeId', 'attributeOptionId', 'textValue', 'numberValue', 'booleanValue']);
  const normalized = [];
  for (const candidate of value) {
    const shapeError = strictObject(candidate, allowed);
    if (shapeError) return { error: 'ساختار مقدار ویژگی محصول معتبر نیست.' };
    const attributeId = validateCatalogEntityId(candidate.attributeId, 'شناسه ویژگی');
    if (attributeId.error) return attributeId;
    const present = ['attributeOptionId', 'textValue', 'numberValue', 'booleanValue']
      .filter(key => Object.hasOwn(candidate, key) && candidate[key] !== null && candidate[key] !== undefined);
    if (present.length !== 1) return { error: 'برای هر ویژگی دقیقاً یک نوع مقدار باید ارسال شود.' };
    const row = { attributeId: attributeId.value };
    const field = present[0];
    if (field === 'attributeOptionId') {
      const optionId = validateCatalogEntityId(candidate.attributeOptionId, 'شناسه مقدار ویژگی');
      if (optionId.error) return optionId;
      row.attributeOptionId = optionId.value;
    } else if (field === 'textValue') {
      const parsed = cleanRequiredText(candidate.textValue, 'مقدار متنی ویژگی', 4000);
      if (parsed.error) return parsed;
      row.textValue = parsed.value;
    } else if (field === 'numberValue') {
      const raw = typeof candidate.numberValue === 'number' ? String(candidate.numberValue) : String(candidate.numberValue).trim();
      if (!DECIMAL_PATTERN.test(raw)) return { error: 'مقدار عددی ویژگی معتبر نیست.' };
      row.numberValue = raw;
    } else {
      if (typeof candidate.booleanValue !== 'boolean') return { error: 'مقدار بله/خیر ویژگی معتبر نیست.' };
      row.booleanValue = candidate.booleanValue;
    }
    normalized.push(row);
  }
  return { data: normalized };
}

export function validateResolvedProductAttributeValues({ assignments, options, values, enforceRequired = true }) {
  const assignmentByAttribute = new Map(assignments.map(item => [item.attributeId, item]));
  const optionById = new Map(options.map(item => [item.id, item]));
  const counts = new Map();
  const optionKeys = new Set();
  const data = [];

  for (const value of values) {
    const assignment = assignmentByAttribute.get(value.attributeId);
    if (!assignment) return { error: 'این ویژگی به دسته‌بندی محصول اختصاص داده نشده است.' };
    if (!assignment.attribute?.isActive) return { error: 'ویژگی غیرفعال را نمی‌توان به محصول اختصاص داد.' };
    const inputType = assignment.attribute.inputType;
    const field = ['attributeOptionId', 'textValue', 'numberValue', 'booleanValue'].find(key => Object.hasOwn(value, key));
    const expectedField = {
      SELECT: 'attributeOptionId',
      MULTI_SELECT: 'attributeOptionId',
      COLOR: 'attributeOptionId',
      TEXT: 'textValue',
      NUMBER: 'numberValue',
      BOOLEAN: 'booleanValue',
    }[inputType];
    if (field !== expectedField) return { error: 'نوع مقدار با نوع ورودی ویژگی سازگار نیست.' };

    if (field === 'attributeOptionId') {
      const option = optionById.get(value.attributeOptionId);
      if (!option || option.attributeId !== value.attributeId) return { error: 'مقدار انتخابی به این ویژگی تعلق ندارد.' };
      if (!option.isActive) return { error: 'مقدار غیرفعال را نمی‌توان برای محصول انتخاب کرد.' };
      const optionKey = `${assignment.id}:${option.id}`;
      if (optionKeys.has(optionKey)) return { error: 'مقدار ویژگی تکراری است.' };
      optionKeys.add(optionKey);
    }

    const nextCount = (counts.get(value.attributeId) || 0) + 1;
    counts.set(value.attributeId, nextCount);
    if (inputType === 'SELECT' && nextCount > 1) return { error: 'ویژگی SELECT فقط یک مقدار می‌پذیرد.' };
    if (inputType === 'COLOR' && !assignment.allowsMultiple && nextCount > 1) {
      return { error: 'برای این ویژگی رنگ فقط یک مقدار مجاز است.' };
    }
    if (['TEXT', 'NUMBER', 'BOOLEAN'].includes(inputType) && nextCount > 1) {
      return { error: 'ویژگی اطلاعاتی فقط یک مقدار می‌پذیرد.' };
    }
    data.push({ ...value, categoryAttributeId: assignment.id });
  }

  if (enforceRequired) {
    const missing = assignments.find(item => item.isRequired && !counts.get(item.attributeId));
    if (missing) return { error: `ویژگی الزامی «${missing.attribute.nameFa}» مقدار ندارد.` };
  }
  return { data };
}
