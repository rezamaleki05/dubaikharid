const clean = value => String(value || '').trim().replace(/\s+/g, ' ');

// Join overlapping commercial labels without repeating Brand or Series.
export function laptopIdentityName({ brand, series, model }) {
  let result = '';
  for (const part of [brand, series, model].map(clean).filter(Boolean)) {
    const left = result.toLowerCase();
    const right = part.toLowerCase();
    if (!left || right === left || right.startsWith(`${left} `)) result = part;
    else if (left.endsWith(` ${right}`)) continue;
    else {
      const words = part.split(' ');
      let overlap = 0;
      for (let count = 1; count <= words.length; count++) {
        if (left === words.slice(0, count).join(' ').toLowerCase() || left.endsWith(` ${words.slice(0, count).join(' ').toLowerCase()}`)) overlap = count;
      }
      result = [result, ...words.slice(overlap)].filter(Boolean).join(' ');
    }
  }
  return result;
}

export function laptopDisplayName(laptop, locale = 'fa') {
  return clean(locale === 'en' ? laptop.displayNameEn : laptop.displayNameFa)
    || clean(locale === 'en' ? laptop.displayNameFa : laptop.displayNameEn)
    || laptopIdentityName(laptop) || clean(laptop.name) || 'لپ‌تاپ استوک';
}

export function suggestedLaptopNames(form, brandFa = '') {
  if (!clean(form.brand) || !clean(form.model)) return { displayNameFa: '', displayNameEn: '' };
  return {
    displayNameEn: laptopIdentityName(form),
    displayNameFa: `لپ تاپ استوک ${laptopIdentityName({ ...form, brand: brandFa || form.brand })}`,
  };
}

// Only fields with explicitly tracked automatic provenance are regenerated.
export function changeLaptopIdentity(form, patch, manualNames = {}, brandFa = '') {
  const next = { ...form, ...patch };
  if (Object.hasOwn(patch, 'brand') && patch.brand !== form.brand) { next.series = ''; next.model = ''; }
  else if (Object.hasOwn(patch, 'series') && patch.series !== form.series) next.model = '';
  const suggestions = suggestedLaptopNames(next, brandFa);
  for (const key of ['displayNameFa', 'displayNameEn']) if (!manualNames[key]) next[key] = suggestions[key];
  return next;
}

export function laptopCatalogOptions(brand, series = '') {
  const rows = brand?.laptopModels || [];
  return {
    // Only the original curated family entries are treated as legacy Series suggestions.
    series: [...new Set(rows.flatMap(row => row.series ? [row.series] : !row.exactModel && row.id.startsWith('laptop-model-') ? [row.name] : []))],
    models: rows.filter(row => row.exactModel && clean(row.series).toLowerCase() === clean(series).toLowerCase()).map(row => row.exactModel),
  };
}
