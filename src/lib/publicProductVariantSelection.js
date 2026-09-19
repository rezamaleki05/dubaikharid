function selectedEntries(selection, ignoredAxisCode = null) {
  return Object.entries(selection || {}).filter(([code, value]) => (
    code !== ignoredAxisCode && typeof value === 'string' && value
  ));
}

function variantOptionMap(variant) {
  return new Map((variant?.options || []).map(option => [option.attributeCode, option.optionCode]));
}

function variantMatchesSelection(variant, selection, ignoredAxisCode = null) {
  const options = variantOptionMap(variant);
  return selectedEntries(selection, ignoredAxisCode)
    .every(([attributeCode, optionCode]) => options.get(attributeCode) === optionCode);
}

function variantCanBePurchased(variant, supplyMode) {
  return supplyMode !== 'IRAN_STOCK' || variant?.available === true;
}

export function getPublicOptionState({
  variants,
  selection,
  axisCode,
  optionCode,
  supplyMode,
}) {
  const nextSelection = { ...(selection || {}), [axisCode]: optionCode };
  const matches = (variants || []).filter(variant => variantMatchesSelection(variant, nextSelection));
  const structurallyCompatible = matches.length > 0;
  const available = matches.some(variant => variantCanBePurchased(variant, supplyMode));
  const narrowedByAnotherAxis = selectedEntries(selection, axisCode).length > 0;
  return {
    structurallyCompatible,
    available,
    disabled: !structurallyCompatible || (narrowedByAnotherAxis && !available),
  };
}

export function updatePublicVariantSelection({
  axes,
  variants,
  selection,
  axisCode,
  optionCode,
}) {
  const next = { ...(selection || {}) };
  if (next[axisCode] === optionCode) delete next[axisCode];
  else next[axisCode] = optionCode;

  for (const axis of axes || []) {
    if (axis.code === axisCode || !next[axis.code]) continue;
    if (!(variants || []).some(variant => variantMatchesSelection(variant, next))) {
      delete next[axis.code];
    }
  }
  return next;
}

export function resolveExactPublicVariant({ axes, variants, selection }) {
  const axisCodes = (axes || []).map(axis => axis.code);
  if (axisCodes.some(code => !selection?.[code])) {
    return { status: 'incomplete', variant: null };
  }
  const matches = (variants || []).filter(variant => (
    variantMatchesSelection(variant, selection)
    && axisCodes.every(code => variantOptionMap(variant).has(code))
  ));
  if (matches.length === 0) return { status: 'unavailable', variant: null };
  if (matches.length > 1) return { status: 'integrity_error', variant: null };
  return { status: 'resolved', variant: matches[0] };
}

export function selectedPublicVariantSummary(axes, selection) {
  return (axes || []).flatMap(axis => {
    const option = axis.options?.find(candidate => candidate.code === selection?.[axis.code]);
    return option ? [{
      attributeCode: axis.code,
      attributeNameFa: axis.nameFa,
      optionCode: option.code,
      labelFa: option.labelFa,
    }] : [];
  });
}

export function formatPublicAttributeValues(attribute) {
  return (attribute?.values || []).map(value => {
    if (value.labelFa) return value.labelFa;
    if (typeof value.value === 'boolean') return value.value ? 'بله' : 'خیر';
    if (value.value === null || value.value === undefined || value.value === '') return '';
    return `${value.value}${attribute.unitFa ? ` ${attribute.unitFa}` : ''}`;
  }).filter(Boolean).join('، ');
}
