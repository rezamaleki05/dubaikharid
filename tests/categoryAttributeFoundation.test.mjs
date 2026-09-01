import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  normalizeProductAttributeValueInputs,
  validateAttributeOptionPayload,
  validateCatalogAttributePayload,
  validateCategoryAttributeConfiguration,
  validateCategoryAttributePayload,
  validateResolvedProductAttributeValues,
} from '../src/lib/catalogAttributeDomain.js';

async function source(path) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

const schema = await source('../prisma/schema.prisma');
const migration = await source('../prisma/migrations/20260902000100_category_attribute_foundation/migration.sql');
const service = await source('../src/lib/adminCatalogAttributeService.js');
const attributeRoute = await source('../src/app/api/admin/catalog-attributes/route.js');
const categoryAssignmentRoute = await source('../src/app/api/admin/categories/[id]/attributes/route.js');

const colorAssignment = {
  id: 'category-color',
  attributeId: 'color',
  isRequired: true,
  allowsMultiple: true,
  attribute: { id: 'color', nameFa: 'رنگ', inputType: 'COLOR', isActive: true },
};
const sizeAssignment = {
  id: 'category-size',
  attributeId: 'eu_size',
  isRequired: true,
  allowsMultiple: true,
  attribute: { id: 'eu_size', nameFa: 'سایز اروپا', inputType: 'MULTI_SELECT', isActive: true },
};
const materialAssignment = {
  id: 'category-material',
  attributeId: 'material',
  isRequired: false,
  allowsMultiple: false,
  attribute: { id: 'material', nameFa: 'جنس', inputType: 'SELECT', isActive: true },
};
const options = [
  { id: 'black', attributeId: 'color', isActive: true },
  { id: 'white', attributeId: 'color', isActive: true },
  { id: 'size-38', attributeId: 'eu_size', isActive: true },
  { id: 'size-39', attributeId: 'eu_size', isActive: true },
  { id: 'leather', attributeId: 'material', isActive: true },
];

test('CatalogAttribute accepts Color and EU Size and normalizes stable technical codes', () => {
  const color = validateCatalogAttributePayload({ code: ' Color ', nameFa: 'رنگ', nameEn: 'Color', inputType: 'COLOR' });
  const size = validateCatalogAttributePayload({ code: 'eu_size', nameFa: 'سایز اروپا', nameEn: 'EU Size', inputType: 'MULTI_SELECT' });
  assert.equal(color.data.code, 'color');
  assert.equal(color.data.inputType, 'COLOR');
  assert.equal(size.data.code, 'eu_size');
  assert.equal(size.data.inputType, 'MULTI_SELECT');
  assert.equal(validateCatalogAttributePayload({ code: 'COLOR', nameFa: 'رنگ دوم', nameEn: 'Second Color', inputType: 'COLOR' }).data.code, color.data.code);
  assert.match(schema, /code\s+String\s+@unique/);
  assert.match(service, /ATTRIBUTE_CODE_EXISTS/);
});

test('AttributeOption validates Black and White swatches and rejects invalid swatches', () => {
  const black = validateAttributeOptionPayload({ code: 'black', labelFa: 'مشکی', labelEn: 'Black', swatchHex: '#000000' });
  const white = validateAttributeOptionPayload({ code: 'white', labelFa: 'سفید', labelEn: 'White', swatchHex: '#ffffff' });
  assert.equal(black.data.swatchHex, '#000000');
  assert.equal(white.data.swatchHex, '#FFFFFF');
  assert.match(validateAttributeOptionPayload({ code: 'bad', labelFa: 'بد', labelEn: 'Bad', swatchHex: 'black' }).error, /#000000/);
  assert.match(migration, /AttributeOption_swatchHex_format/);
});

test('option uniqueness is scoped to one attribute and the same option code may exist under another attribute', () => {
  assert.match(schema, /@@unique\(\[attributeId, code\]\)/);
  assert.doesNotMatch(schema, /model AttributeOption[\s\S]*?code\s+String\s+@unique/);
  assert.match(service, /attributeId_code/);
  assert.match(service, /OPTION_CODE_EXISTS/);
});

test('CategoryAttribute preserves configuration and limits variant-defining scalar types', () => {
  const assignment = validateCategoryAttributePayload({
    attributeId: 'color',
    isRequired: true,
    isVariantDefining: true,
    allowsMultiple: true,
    sortOrder: 7,
  });
  assert.deepEqual(assignment.data, {
    attributeId: 'color',
    isRequired: true,
    isVariantDefining: true,
    allowsMultiple: true,
    sortOrder: 7,
  });
  assert.equal(validateCategoryAttributeConfiguration('COLOR', assignment.data).error, undefined);
  assert.equal(validateCategoryAttributeConfiguration('SELECT', { ...assignment.data, allowsMultiple: false }).error, undefined);
  for (const inputType of ['TEXT', 'NUMBER', 'BOOLEAN']) {
    assert.match(validateCategoryAttributeConfiguration(inputType, assignment.data).error, /سازنده تنوع/);
  }
  assert.match(validateCategoryAttributeConfiguration('SELECT', assignment.data).error, /انتخاب چندگانه/);
  assert.match(schema, /@@unique\(\[categoryId, attributeId\]\)/);
  assert.match(service, /CATEGORY_ATTRIBUTE_EXISTS/);
});

test('valid ProductAttributeValue options assigned to the Product category are accepted', () => {
  const normalized = normalizeProductAttributeValueInputs([
    { attributeId: 'color', attributeOptionId: 'black' },
    { attributeId: 'eu_size', attributeOptionId: 'size-38' },
    { attributeId: 'eu_size', attributeOptionId: 'size-39' },
    { attributeId: 'material', attributeOptionId: 'leather' },
  ]);
  assert.equal(normalized.error, undefined);
  const result = validateResolvedProductAttributeValues({
    assignments: [colorAssignment, sizeAssignment, materialAssignment],
    options,
    values: normalized.data,
  });
  assert.equal(result.error, undefined);
  assert.deepEqual(result.data.map(item => item.categoryAttributeId), [
    'category-color', 'category-size', 'category-size', 'category-material',
  ]);
});

test('ProductAttributeValue rejects wrong attributes, wrong options, wrong scalar types, and multiple representations', () => {
  const notAssigned = validateResolvedProductAttributeValues({
    assignments: [colorAssignment], options, values: [{ attributeId: 'material', attributeOptionId: 'leather' }],
  });
  assert.match(notAssigned.error, /اختصاص داده نشده/);

  const wrongOption = validateResolvedProductAttributeValues({
    assignments: [colorAssignment], options, values: [{ attributeId: 'color', attributeOptionId: 'leather' }],
  });
  assert.match(wrongOption.error, /تعلق ندارد/);

  const wrongScalar = validateResolvedProductAttributeValues({
    assignments: [materialAssignment], options, values: [{ attributeId: 'material', textValue: 'Leather' }],
  });
  assert.match(wrongScalar.error, /سازگار نیست/);

  const multiple = normalizeProductAttributeValueInputs([
    { attributeId: 'color', attributeOptionId: 'black', textValue: 'Black' },
  ]);
  assert.match(multiple.error, /دقیقاً یک/);
  assert.match(migration, /ProductAttributeValue_exactly_one_value/);
  assert.match(migration, /num_nonnulls/);
});

test('SELECT accepts one option, MULTI_SELECT accepts several, and duplicate selections are rejected', () => {
  const selectMultiple = validateResolvedProductAttributeValues({
    assignments: [materialAssignment],
    options: [...options, { id: 'textile', attributeId: 'material', isActive: true }],
    values: [
      { attributeId: 'material', attributeOptionId: 'leather' },
      { attributeId: 'material', attributeOptionId: 'textile' },
    ],
  });
  assert.match(selectMultiple.error, /SELECT/);

  const multi = validateResolvedProductAttributeValues({
    assignments: [sizeAssignment], options,
    values: [
      { attributeId: 'eu_size', attributeOptionId: 'size-38' },
      { attributeId: 'eu_size', attributeOptionId: 'size-39' },
    ],
  });
  assert.equal(multi.error, undefined);

  const duplicate = validateResolvedProductAttributeValues({
    assignments: [sizeAssignment], options,
    values: [
      { attributeId: 'eu_size', attributeOptionId: 'size-38' },
      { attributeId: 'eu_size', attributeOptionId: 'size-38' },
    ],
  });
  assert.match(duplicate.error, /تکراری/);
});

test('inactive attributes and options remain readable but cannot be selected for new Product data', () => {
  const inactiveAttribute = validateResolvedProductAttributeValues({
    assignments: [{ ...colorAssignment, attribute: { ...colorAssignment.attribute, isActive: false } }],
    options,
    values: [{ attributeId: 'color', attributeOptionId: 'black' }],
  });
  assert.match(inactiveAttribute.error, /ویژگی غیرفعال/);

  const inactiveOption = validateResolvedProductAttributeValues({
    assignments: [colorAssignment],
    options: [{ id: 'black', attributeId: 'color', isActive: false }],
    values: [{ attributeId: 'color', attributeOptionId: 'black' }],
  });
  assert.match(inactiveOption.error, /مقدار غیرفعال/);
  assert.match(service, /isActive: false/);
  assert.doesNotMatch(service, /catalogAttribute\.delete/);
  assert.doesNotMatch(service, /attributeOption\.delete/);
});

test('existing Products need no attribute values and Product category changes have an explicit compatibility helper', () => {
  assert.equal(validateResolvedProductAttributeValues({ assignments: [], options: [], values: [] }).error, undefined);
  assert.match(schema, /attributeValues\s+ProductAttributeValue\[\]/);
  assert.match(service, /checkProductCategoryAttributeCompatibility/);
  assert.match(service, /invalidAttributeIds/);
  assert.doesNotMatch(service.match(/checkProductCategoryAttributeCompatibility[\s\S]*$/)?.[0] || '', /deleteMany/);
});

test('migration is one additive foundation migration with composite integrity and practical indexes', () => {
  assert.match(migration, /CREATE TYPE "CatalogAttributeInputType"/);
  for (const table of ['CatalogAttribute', 'AttributeOption', 'CategoryAttribute', 'ProductAttributeValue']) {
    assert.match(migration, new RegExp(`CREATE TABLE "${table}"`));
  }
  assert.match(migration, /ProductAttributeValue_categoryAttributeId_attributeId_fkey/);
  assert.match(migration, /ProductAttributeValue_attributeOptionId_attributeId_fkey/);
  assert.match(migration, /ProductAttributeValue_one_scalar_per_assignment/);
  assert.doesNotMatch(migration, /^\s*(?:DROP|DELETE|TRUNCATE|UPDATE)\b/im);
});

test('minimal Admin APIs preserve existing RBAC and delegate writes to the server domain service', () => {
  assert.match(attributeRoute, /authorizeAdminApiRequest\(request, ADMIN_PERMISSIONS\.CATEGORIES_MANAGE\)/);
  assert.match(attributeRoute, /createCatalogAttribute\(prisma, validated\.data\)/);
  assert.match(categoryAssignmentRoute, /assignCategoryAttribute\(prisma, id\.value, validated\.data\)/);
  assert.match(service, /replaceProductAttributeValues/);
  assert.match(service, /getProductAttributeValues/);
});
