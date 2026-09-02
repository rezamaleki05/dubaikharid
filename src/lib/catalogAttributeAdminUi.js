export const ATTRIBUTE_TYPE_META = Object.freeze({
  SELECT: { label: 'انتخاب تکی', shortLabel: 'SELECT', supportsOptions: true, supportsVariant: true },
  MULTI_SELECT: { label: 'انتخاب چندگانه', shortLabel: 'MULTI', supportsOptions: true, supportsVariant: true },
  TEXT: { label: 'متن', shortLabel: 'TEXT', supportsOptions: false, supportsVariant: false },
  NUMBER: { label: 'عدد', shortLabel: 'NUMBER', supportsOptions: false, supportsVariant: false },
  BOOLEAN: { label: 'بله / خیر', shortLabel: 'BOOLEAN', supportsOptions: false, supportsVariant: false },
  COLOR: { label: 'رنگ', shortLabel: 'COLOR', supportsOptions: true, supportsVariant: true },
});

export const ATTRIBUTE_FILTERS = Object.freeze([
  { value: 'all', label: 'همه' },
  { value: 'active', label: 'فعال' },
  { value: 'inactive', label: 'غیرفعال' },
]);

export function getAttributeTypeMeta(inputType) {
  return ATTRIBUTE_TYPE_META[inputType] || {
    label: inputType || 'نامشخص',
    shortLabel: inputType || 'UNKNOWN',
    supportsOptions: false,
    supportsVariant: false,
  };
}

export function canManageAttributeOptions(inputType) {
  return getAttributeTypeMeta(inputType).supportsOptions;
}

export function canDefineVariants(inputType) {
  return getAttributeTypeMeta(inputType).supportsVariant;
}

export function isAttributeIdentityLocked(attribute) {
  return Boolean((attribute?.options?.length || 0) + (attribute?.categoryAssignments?.length || 0));
}

export function filterAndSortCatalogAttributes(attributes, { query = '', status = 'all' } = {}) {
  const needle = String(query).trim().toLocaleLowerCase('fa');
  return [...(Array.isArray(attributes) ? attributes : [])]
    .filter(attribute => {
      if (status === 'active' && !attribute.isActive) return false;
      if (status === 'inactive' && attribute.isActive) return false;
      if (!needle) return true;
      return [attribute.nameFa, attribute.nameEn, attribute.code, attribute.inputType]
        .some(value => String(value || '').toLocaleLowerCase('fa').includes(needle));
    })
    .sort((left, right) => (
      Number(left.sortOrder || 0) - Number(right.sortOrder || 0)
      || String(left.nameFa || '').localeCompare(String(right.nameFa || ''), 'fa')
      || String(left.code || '').localeCompare(String(right.code || ''))
    ));
}

export function catalogAdminErrorMessage(payload, fallback = 'ذخیره تغییرات با خطا مواجه شد.') {
  if (payload && typeof payload.error === 'string' && payload.error.trim()) return payload.error.trim();
  return fallback;
}
