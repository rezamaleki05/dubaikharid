const option = (code, labelFa, labelEn = labelFa, swatchHex = null) => ({
  code,
  labelFa,
  labelEn,
  swatchHex,
});

const numberedOptions = values => values.map(value => option(
  String(value).replace('.', '_').toLowerCase(),
  String(value),
));

const COLOR_OPTIONS = Object.freeze([
  option('black', 'مشکی', 'Black', '#000000'),
  option('white', 'سفید', 'White', '#FFFFFF'),
  option('beige', 'بژ', 'Beige', '#D9C7A3'),
  option('brown', 'قهوه‌ای', 'Brown', '#7A4B2A'),
  option('gray', 'خاکستری', 'Gray', '#808080'),
  option('navy', 'سرمه‌ای', 'Navy', '#1D2951'),
  option('blue', 'آبی', 'Blue', '#2563EB'),
  option('red', 'قرمز', 'Red', '#DC2626'),
  option('green', 'سبز', 'Green', '#16A34A'),
  option('pink', 'صورتی', 'Pink', '#EC4899'),
  option('purple', 'بنفش', 'Purple', '#9333EA'),
  option('orange', 'نارنجی', 'Orange', '#F97316'),
  option('yellow', 'زرد', 'Yellow', '#EAB308'),
  option('gold', 'طلایی', 'Gold', '#D4AF37'),
  option('silver', 'نقره‌ای', 'Silver', '#C0C0C0'),
  option('rose-gold', 'رزگلد', 'Rose Gold', '#B76E79'),
  option('transparent', 'شفاف', 'Transparent'),
  option('multicolor', 'چندرنگ', 'Multicolor'),
]);

const attribute = (code, nameFa, nameEn, inputType, options = [], extra = {}) => ({
  code,
  nameFa,
  nameEn,
  inputType,
  options,
  ...extra,
});

export const STANDARD_CATALOG_ATTRIBUTES = Object.freeze([
  attribute('color', 'رنگ', 'Color', 'COLOR', COLOR_OPTIONS),
  attribute('shoe_size_eu', 'سایز EU', 'EU Size', 'MULTI_SELECT', numberedOptions([
    35, 35.5, 36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40, 40.5, 41, 41.5, 42, 42.5, 43, 43.5,
    44, 44.5, 45, 45.5, 46, 46.5, 47,
  ])),
  attribute('clothing_size', 'سایز', 'Size', 'MULTI_SELECT', [
    'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL',
  ].map(value => option(value.toLowerCase(), value, value))),
  attribute('waist_size', 'سایز کمر', 'Waist Size', 'MULTI_SELECT', numberedOptions([
    26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38, 40, 42, 44,
  ])),
  attribute('length_size', 'قد شلوار', 'Length', 'MULTI_SELECT', numberedOptions([28, 30, 32, 34, 36])),
  attribute('material', 'جنس', 'Material', 'SELECT', [
    option('cotton', 'پنبه', 'Cotton'),
    option('polyester', 'پلی‌استر', 'Polyester'),
    option('leather', 'چرم', 'Leather'),
    option('synthetic-leather', 'چرم مصنوعی', 'Synthetic Leather'),
    option('suede', 'جیر', 'Suede'),
    option('denim', 'جین', 'Denim'),
    option('linen', 'لینن', 'Linen'),
    option('wool', 'پشم', 'Wool'),
    option('silk', 'ابریشم', 'Silk'),
    option('nylon', 'نایلون', 'Nylon'),
    option('rubber', 'لاستیک', 'Rubber'),
    option('textile', 'پارچه‌ای', 'Textile'),
    option('metal', 'فلز', 'Metal'),
    option('plastic', 'پلاستیک', 'Plastic'),
    option('stainless-steel', 'استیل ضدزنگ', 'Stainless Steel'),
    option('other', 'سایر', 'Other'),
  ]),
  attribute('fit', 'نوع فیت', 'Fit', 'SELECT', [
    option('slim', 'اسلیم', 'Slim'),
    option('regular', 'معمولی', 'Regular'),
    option('relaxed', 'آزاد', 'Relaxed'),
    option('oversized', 'اورسایز', 'Oversized'),
    option('skinny', 'جذب', 'Skinny'),
    option('wide', 'گشاد', 'Wide'),
  ]),
  attribute('bag_size', 'اندازه کیف', 'Bag Size', 'MULTI_SELECT', [
    option('mini', 'مینی', 'Mini'),
    option('small', 'کوچک', 'Small'),
    option('medium', 'متوسط', 'Medium'),
    option('large', 'بزرگ', 'Large'),
  ]),
  attribute('volume_ml', 'حجم', 'Volume', 'MULTI_SELECT', numberedOptions([
    5, 10, 15, 20, 30, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000,
  ]), { unitFa: 'میلی‌لیتر', unitEn: 'ml' }),
  attribute('weight_g', 'وزن', 'Weight', 'MULTI_SELECT', numberedOptions([
    30, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 2000,
  ]), { unitFa: 'گرم', unitEn: 'g' }),
  attribute('shade', 'رنگ / شید', 'Shade', 'MULTI_SELECT', [
    option('light', 'روشن', 'Light'),
    option('medium', 'متوسط', 'Medium'),
    option('tan', 'برنزه', 'Tan'),
    option('deep', 'تیره', 'Deep'),
  ]),
  attribute('finish', 'فینیش', 'Finish', 'SELECT', [
    option('matte', 'مات', 'Matte'),
    option('glossy', 'براق', 'Glossy'),
    option('satin', 'ساتن', 'Satin'),
    option('natural', 'طبیعی', 'Natural'),
    option('dewy', 'درخشان', 'Dewy'),
    option('metallic', 'متالیک', 'Metallic'),
  ]),
  attribute('skin_type', 'نوع پوست', 'Skin Type', 'SELECT', [
    option('normal', 'معمولی', 'Normal'),
    option('dry', 'خشک', 'Dry'),
    option('oily', 'چرب', 'Oily'),
    option('combination', 'مختلط', 'Combination'),
    option('sensitive', 'حساس', 'Sensitive'),
    option('all', 'انواع پوست', 'All Skin Types'),
  ]),
  attribute('fragrance_concentration', 'غلظت عطر', 'Concentration', 'SELECT', [
    option('parfum', 'Parfum', 'Parfum'),
    option('edp', 'Eau de Parfum', 'Eau de Parfum'),
    option('edt', 'Eau de Toilette', 'Eau de Toilette'),
    option('edc', 'Eau de Cologne', 'Eau de Cologne'),
    option('body-mist', 'Body Mist', 'Body Mist'),
  ]),
  attribute('flavor', 'طعم', 'Flavor', 'MULTI_SELECT', [
    option('chocolate', 'شکلات', 'Chocolate'),
    option('vanilla', 'وانیل', 'Vanilla'),
    option('strawberry', 'توت‌فرنگی', 'Strawberry'),
    option('banana', 'موز', 'Banana'),
    option('unflavored', 'بدون طعم', 'Unflavored'),
  ]),
  attribute('serving_count', 'تعداد سروینگ', 'Serving Count', 'NUMBER'),
  attribute('storage', 'حافظه', 'Storage', 'MULTI_SELECT', [
    option('64gb', '64GB', '64GB'),
    option('128gb', '128GB', '128GB'),
    option('256gb', '256GB', '256GB'),
    option('512gb', '512GB', '512GB'),
    option('1tb', '1TB', '1TB'),
    option('2tb', '2TB', '2TB'),
  ]),
  attribute('ram', 'رم', 'RAM', 'MULTI_SELECT', [
    option('4gb', '4GB', '4GB'),
    option('6gb', '6GB', '6GB'),
    option('8gb', '8GB', '8GB'),
    option('12gb', '12GB', '12GB'),
    option('16gb', '16GB', '16GB'),
    option('24gb', '24GB', '24GB'),
    option('32gb', '32GB', '32GB'),
    option('64gb', '64GB', '64GB'),
  ]),
  attribute('watch_case_size', 'اندازه قاب ساعت', 'Case Size', 'MULTI_SELECT', [
    28, 30, 32, 34, 36, 38, 40, 41, 42, 44, 45, 46,
  ].map(value => option(`${value}mm`, `${value}mm`, `${value}mm`))),
  attribute('strap_material', 'جنس بند', 'Strap Material', 'SELECT', [
    option('leather', 'چرم', 'Leather'),
    option('silicone', 'سیلیکون', 'Silicone'),
    option('stainless-steel', 'استیل', 'Stainless Steel'),
    option('fabric', 'پارچه', 'Fabric'),
    option('rubber', 'لاستیک', 'Rubber'),
  ]),
  attribute('frame_color', 'رنگ فریم', 'Frame Color', 'COLOR', COLOR_OPTIONS.map(value => ({ ...value }))),
  attribute('lens_color', 'رنگ لنز', 'Lens Color', 'COLOR', COLOR_OPTIONS.map(value => ({ ...value }))),
].map((value, index) => Object.freeze({ ...value, sortOrder: (index + 1) * 10 })));

const assignment = (
  attributeCode,
  { required = false, variant = false, multiple = false } = {},
) => ({
  attributeCode,
  isRequired: required,
  isVariantDefining: variant,
  allowsMultiple: multiple,
});

const VARIANT_COLOR = assignment('color', { required: true, variant: true, multiple: true });
const OPTIONAL_VARIANT_COLOR = assignment('color', { variant: true, multiple: true });
const MATERIAL = assignment('material');
const FIT = assignment('fit');

const category = (key, nameFa, nameEn, assignments, aliases = []) => ({
  key,
  id: `catalog-${key}`,
  query: key,
  nameFa,
  nameEn,
  aliases,
  assignments,
});

export const STANDARD_CATALOG_CATEGORIES = Object.freeze([
  category('womens-shoes', 'کفش زنانه', "Women's Shoes", [
    VARIANT_COLOR,
    assignment('shoe_size_eu', { required: true, variant: true, multiple: true }),
    MATERIAL,
    FIT,
  ]),
  category('mens-shoes', 'کفش مردانه', "Men's Shoes", [
    VARIANT_COLOR,
    assignment('shoe_size_eu', { required: true, variant: true, multiple: true }),
    MATERIAL,
    FIT,
  ]),
  category('kids-shoes', 'کفش بچگانه', "Kids' Shoes", [
    VARIANT_COLOR,
    assignment('shoe_size_eu', { required: true, variant: true, multiple: true }),
    MATERIAL,
    FIT,
  ]),
  category('womens-clothing', 'لباس زنانه', "Women's Clothing", [
    VARIANT_COLOR,
    assignment('clothing_size', { required: true, variant: true, multiple: true }),
    MATERIAL,
    FIT,
  ]),
  category('mens-clothing', 'لباس مردانه', "Men's Clothing", [
    VARIANT_COLOR,
    assignment('clothing_size', { required: true, variant: true, multiple: true }),
    MATERIAL,
    FIT,
  ]),
  category('kids-clothing', 'لباس بچگانه', "Kids' Clothing", [
    VARIANT_COLOR,
    assignment('clothing_size', { required: true, variant: true, multiple: true }),
    MATERIAL,
    FIT,
  ]),
  category('womens-tops', 'تی‌شرت و تاپ زنانه', "Women's Tops & T-Shirts", [
    VARIANT_COLOR,
    assignment('clothing_size', { required: true, variant: true, multiple: true }),
    MATERIAL,
    FIT,
  ]),
  category('mens-tops', 'تی‌شرت و پیراهن مردانه', "Men's Tops & Shirts", [
    VARIANT_COLOR,
    assignment('clothing_size', { required: true, variant: true, multiple: true }),
    MATERIAL,
    FIT,
  ]),
  category('womens-pants', 'شلوار و جین زنانه', "Women's Pants & Jeans", [
    VARIANT_COLOR,
    assignment('waist_size', { required: true, variant: true, multiple: true }),
    assignment('length_size', { variant: true, multiple: true }),
    MATERIAL,
    FIT,
  ]),
  category('mens-pants', 'شلوار و جین مردانه', "Men's Pants & Jeans", [
    VARIANT_COLOR,
    assignment('waist_size', { required: true, variant: true, multiple: true }),
    assignment('length_size', { variant: true, multiple: true }),
    MATERIAL,
    FIT,
  ]),
  category('womens-dresses', 'پیراهن و لباس زنانه', "Women's Dresses", [
    VARIANT_COLOR,
    assignment('clothing_size', { required: true, variant: true, multiple: true }),
    MATERIAL,
    FIT,
  ]),
  category('womens-activewear', 'لباس ورزشی زنانه', "Women's Activewear", [
    VARIANT_COLOR,
    assignment('clothing_size', { required: true, variant: true, multiple: true }),
    MATERIAL,
    FIT,
  ]),
  category('mens-activewear', 'لباس ورزشی مردانه', "Men's Activewear", [
    VARIANT_COLOR,
    assignment('clothing_size', { required: true, variant: true, multiple: true }),
    MATERIAL,
    FIT,
  ]),
  category('womens-underwear', 'لباس زیر زنانه', "Women's Underwear / Lingerie", [
    VARIANT_COLOR,
    assignment('clothing_size', { required: true, variant: true, multiple: true }),
    MATERIAL,
  ]),
  category('womens-bags', 'کیف زنانه', "Women's Bags", [
    VARIANT_COLOR,
    assignment('bag_size', { variant: true, multiple: true }),
    MATERIAL,
  ]),
  category('mens-bags', 'کیف مردانه', "Men's Bags", [
    VARIANT_COLOR,
    assignment('bag_size', { variant: true, multiple: true }),
    MATERIAL,
  ]),
  category('backpacks', 'کوله‌پشتی', 'Backpacks', [
    VARIANT_COLOR,
    assignment('bag_size', { variant: true, multiple: true }),
    MATERIAL,
  ]),
  category('accessories', 'اکسسوری', 'Accessories', [OPTIONAL_VARIANT_COLOR, MATERIAL], [
    'ساعت و اکسسوری',
    'Watches & Accessories',
  ]),
  category('watches', 'ساعت', 'Watches', [
    OPTIONAL_VARIANT_COLOR,
    assignment('watch_case_size', { variant: true, multiple: true }),
    assignment('strap_material'),
    MATERIAL,
  ]),
  category('sunglasses', 'عینک آفتابی', 'Sunglasses', [
    assignment('frame_color', { variant: true, multiple: true }),
    assignment('lens_color', { variant: true, multiple: true }),
    MATERIAL,
  ]),
  category('makeup', 'لوازم آرایشی', 'Makeup', [
    assignment('shade', { variant: true, multiple: true }),
    assignment('volume_ml', { multiple: true }),
    assignment('finish'),
    assignment('skin_type'),
  ]),
  category('skincare', 'مراقبت پوست', 'Skincare', [
    assignment('volume_ml', { variant: true, multiple: true }),
    assignment('weight_g', { variant: true, multiple: true }),
    assignment('skin_type'),
  ]),
  category('haircare', 'مراقبت مو', 'Hair Care', [
    assignment('volume_ml', { variant: true, multiple: true }),
    assignment('weight_g', { variant: true, multiple: true }),
  ]),
  category('nail-products', 'محصولات ناخن', 'Nail Products', [
    assignment('shade', { variant: true, multiple: true }),
    assignment('volume_ml', { multiple: true }),
  ]),
  category('perfume-fragrance', 'عطر و ادکلن', 'Perfume & Fragrance', [
    assignment('volume_ml', { required: true, variant: true, multiple: true }),
    assignment('fragrance_concentration'),
  ]),
  category('supplements', 'مکمل و تغذیه ورزشی', 'Supplements', [
    assignment('flavor', { variant: true, multiple: true }),
    assignment('weight_g', { variant: true, multiple: true }),
    assignment('serving_count'),
  ]),
  category('electronics', 'لوازم الکترونیکی', 'Electronics', [
    OPTIONAL_VARIANT_COLOR,
    assignment('storage', { variant: true, multiple: true }),
    assignment('ram', { variant: true, multiple: true }),
  ], [
    'موبایل و الکترونیک',
    'Mobile & Electronics',
  ]),
]);

export function normalizeCatalogPresetLookup(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('fa')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200c\u200e\u200f]/g, ' ')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function pickDeterministicMatch(matches, preferredValues) {
  if (!matches.length) return null;
  for (const preferred of preferredValues) {
    const normalized = normalizeCatalogPresetLookup(preferred);
    const exact = matches.find(item => [item.id, item.code, item.query, item.name]
      .some(value => normalizeCatalogPresetLookup(value) === normalized));
    if (exact) return exact;
  }
  return [...matches].sort((left, right) => String(left.id).localeCompare(String(right.id), 'en'))[0];
}

function comparableValue(value) {
  return value ?? null;
}

function changedFields(existing, proposed, fields) {
  return fields.filter(field => comparableValue(existing[field]) !== comparableValue(proposed[field]));
}

export function buildStandardCatalogPresetPlan({ categories = [], attributes = [], assignments = [] } = {}) {
  const plan = {
    create: { attributes: [], options: [], categories: [], assignments: [] },
    reuse: { attributes: [], options: [], categories: [], assignments: [] },
    conflicts: [],
    attributeRefs: new Map(),
    categoryRefs: new Map(),
  };

  for (const preset of STANDARD_CATALOG_ATTRIBUTES) {
    const codeKey = normalizeCatalogPresetLookup(preset.code);
    const matches = attributes.filter(item => normalizeCatalogPresetLookup(item.code) === codeKey);
    const existing = pickDeterministicMatch(matches, [preset.code]);
    if (matches.length > 1) {
      plan.conflicts.push({ type: 'AMBIGUOUS_ATTRIBUTE_MATCH', key: preset.code, preservedIds: matches.map(item => item.id) });
    }
    if (!existing) {
      plan.create.attributes.push(preset);
      plan.attributeRefs.set(preset.code, { preset, existing: null, usable: true });
      for (const [index, presetOption] of preset.options.entries()) {
        plan.create.options.push({ attributeCode: preset.code, ...presetOption, sortOrder: (index + 1) * 10 });
      }
      continue;
    }

    plan.reuse.attributes.push({ code: preset.code, id: existing.id });
    const attributeDifferences = changedFields(existing, {
      ...preset,
      unitFa: preset.unitFa ?? null,
      unitEn: preset.unitEn ?? null,
      isActive: true,
    }, ['nameFa', 'nameEn', 'inputType', 'unitFa', 'unitEn', 'isActive', 'sortOrder']);
    if (attributeDifferences.length) {
      plan.conflicts.push({
        type: 'ATTRIBUTE_CONFIGURATION_PRESERVED',
        key: preset.code,
        id: existing.id,
        fields: attributeDifferences,
      });
    }
    const usable = existing.isActive !== false && existing.inputType === preset.inputType;
    if (!usable) {
      plan.conflicts.push({
        type: 'ATTRIBUTE_INCOMPATIBLE',
        key: preset.code,
        id: existing.id,
        expectedInputType: preset.inputType,
        actualInputType: existing.inputType,
        isActive: existing.isActive,
      });
    }
    plan.attributeRefs.set(preset.code, { preset, existing, usable });
    if (!usable) continue;

    const existingOptions = existing.options || [];
    for (const [index, presetOption] of preset.options.entries()) {
      const optionKey = normalizeCatalogPresetLookup(presetOption.code);
      const optionMatches = existingOptions.filter(item => normalizeCatalogPresetLookup(item.code) === optionKey);
      const existingOption = pickDeterministicMatch(optionMatches, [presetOption.code]);
      if (optionMatches.length > 1) {
        plan.conflicts.push({
          type: 'AMBIGUOUS_OPTION_MATCH',
          key: `${preset.code}:${presetOption.code}`,
          preservedIds: optionMatches.map(item => item.id),
        });
      }
      const proposed = { ...presetOption, isActive: true, sortOrder: (index + 1) * 10 };
      if (!existingOption) {
        plan.create.options.push({ attributeCode: preset.code, ...proposed });
        continue;
      }
      plan.reuse.options.push({ attributeCode: preset.code, code: presetOption.code, id: existingOption.id });
      const optionDifferences = changedFields(existingOption, proposed, [
        'labelFa', 'labelEn', 'swatchHex', 'isActive', 'sortOrder',
      ]);
      if (optionDifferences.length) {
        plan.conflicts.push({
          type: 'OPTION_CONFIGURATION_PRESERVED',
          key: `${preset.code}:${presetOption.code}`,
          id: existingOption.id,
          fields: optionDifferences,
        });
      }
    }
  }

  for (const preset of STANDARD_CATALOG_CATEGORIES) {
    const lookupValues = [preset.id, preset.query, preset.nameFa, preset.nameEn, ...preset.aliases]
      .map(normalizeCatalogPresetLookup);
    const matches = categories.filter(item => [item.id, item.query, item.name]
      .some(value => lookupValues.includes(normalizeCatalogPresetLookup(value))));
    const existing = pickDeterministicMatch(matches, [preset.id, preset.query, preset.nameFa, preset.nameEn]);
    if (matches.length > 1) {
      plan.conflicts.push({ type: 'AMBIGUOUS_CATEGORY_MATCH', key: preset.key, preservedIds: matches.map(item => item.id) });
    }
    if (existing) {
      plan.reuse.categories.push({ key: preset.key, id: existing.id, name: existing.name });
      plan.categoryRefs.set(preset.key, { preset, existing });
    } else {
      plan.create.categories.push(preset);
      plan.categoryRefs.set(preset.key, { preset, existing: null });
    }
  }

  for (const categoryPreset of STANDARD_CATALOG_CATEGORIES) {
    const categoryRef = plan.categoryRefs.get(categoryPreset.key);
    for (const [index, proposedAssignment] of categoryPreset.assignments.entries()) {
      const attributeRef = plan.attributeRefs.get(proposedAssignment.attributeCode);
      const key = `${categoryPreset.key}:${proposedAssignment.attributeCode}`;
      if (!attributeRef?.usable) {
        plan.conflicts.push({ type: 'ASSIGNMENT_SKIPPED_INCOMPATIBLE_ATTRIBUTE', key });
        continue;
      }
      const existingAssignment = categoryRef.existing && attributeRef.existing
        ? assignments.find(item => item.categoryId === categoryRef.existing.id
          && item.attributeId === attributeRef.existing.id)
        : null;
      const proposed = { ...proposedAssignment, sortOrder: (index + 1) * 10 };
      if (!existingAssignment) {
        plan.create.assignments.push({ categoryKey: categoryPreset.key, ...proposed });
        continue;
      }
      plan.reuse.assignments.push({ key, id: existingAssignment.id });
      const assignmentDifferences = changedFields(existingAssignment, proposed, [
        'isRequired', 'isVariantDefining', 'allowsMultiple', 'sortOrder',
      ]);
      if (assignmentDifferences.length) {
        plan.conflicts.push({
          type: 'ASSIGNMENT_CONFIGURATION_PRESERVED',
          key,
          id: existingAssignment.id,
          fields: assignmentDifferences,
        });
      }
    }
  }

  return plan;
}

export function summarizeStandardCatalogPresetPlan(plan) {
  return {
    willCreate: Object.fromEntries(Object.entries(plan.create).map(([key, rows]) => [key, rows.length])),
    willReuse: Object.fromEntries(Object.entries(plan.reuse).map(([key, rows]) => [key, rows.length])),
    preservedConflicts: plan.conflicts.length,
    conflicts: plan.conflicts,
  };
}
