import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  canDefineVariants,
  canManageAttributeOptions,
  filterAndSortCatalogAttributes,
  getAttributeTypeMeta,
  isAttributeIdentityLocked,
} from '../src/lib/catalogAttributeAdminUi.js';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
const attributePage = read('src/app/admin/attributes/page.js');
const attributeForm = read('src/components/admin/catalog/AttributeFormDialog.js');
const optionManager = read('src/components/admin/catalog/OptionManagerDialog.js');
const categoryManager = read('src/components/admin/catalog/CategoryAttributeManager.js');
const adminCss = read('src/components/admin/catalog/CatalogAttributeAdmin.module.css');
const service = read('src/lib/adminCatalogAttributeService.js');

test('attribute list filters active/inactive records and preserves deterministic ordering', () => {
  const attributes = [
    { nameFa: 'ب', nameEn: 'B', code: 'b', inputType: 'TEXT', isActive: true, sortOrder: 20 },
    { nameFa: 'الف', nameEn: 'A', code: 'a', inputType: 'COLOR', isActive: false, sortOrder: 10 },
    { nameFa: 'ج', nameEn: 'C', code: 'c', inputType: 'SELECT', isActive: true, sortOrder: 10 },
  ];
  assert.deepEqual(filterAndSortCatalogAttributes(attributes).map(item => item.code), ['a', 'c', 'b']);
  assert.deepEqual(filterAndSortCatalogAttributes(attributes, { status: 'active' }).map(item => item.code), ['c', 'b']);
  assert.deepEqual(filterAndSortCatalogAttributes(attributes, { status: 'inactive' }).map(item => item.code), ['a']);
  assert.deepEqual(filterAndSortCatalogAttributes(attributes, { query: 'color' }).map(item => item.code), ['a']);
});

test('option and variant capabilities match the Phase 2A input-type contract', () => {
  for (const type of ['SELECT', 'MULTI_SELECT', 'COLOR']) {
    assert.equal(canManageAttributeOptions(type), true);
    assert.equal(canDefineVariants(type), true);
  }
  for (const type of ['TEXT', 'NUMBER', 'BOOLEAN']) {
    assert.equal(canManageAttributeOptions(type), false);
    assert.equal(canDefineVariants(type), false);
  }
  assert.equal(getAttributeTypeMeta('COLOR').label, 'رنگ');
});

test('attribute identity is locked after options or category assignments exist', () => {
  assert.equal(isAttributeIdentityLocked({ options: [], categoryAssignments: [] }), false);
  assert.equal(isAttributeIdentityLocked({ options: [{ id: 'o1' }], categoryAssignments: [] }), true);
  assert.equal(isAttributeIdentityLocked({ options: [], categoryAssignments: [{ id: 'c1' }] }), true);
  assert.match(service, /ATTRIBUTE_CODE_IN_USE/);
  assert.match(service, /ATTRIBUTE_TYPE_IN_USE/);
});

test('attribute page exposes required columns, counts, filters, actions, and active states', () => {
  for (const label of ['نام فارسی / انگلیسی', 'کد', 'نوع', 'گزینه‌ها', 'وضعیت', 'ترتیب', 'عملیات']) {
    assert.match(attributePage, new RegExp(label));
  }
  assert.match(attributePage, /ATTRIBUTE_FILTERS/);
  assert.match(attributePage, /attribute\.options\?\.length/);
  assert.match(attributePage, /غیرفعال‌سازی/);
  assert.match(attributePage, /فعال‌سازی/);
});

test('attribute create/edit form covers bilingual labels, code, type, units, order, and active state', () => {
  for (const field of ['nameFa', 'nameEn', 'code', 'inputType', 'unitFa', 'unitEn', 'sortOrder', 'isActive']) {
    assert.match(attributeForm, new RegExp(field));
  }
  assert.match(attributeForm, /pattern="\[a-z\]\[a-z0-9_\]\{0,63\}"/);
  assert.match(attributeForm, /identityLocked/);
  assert.match(attributeForm, /کد فنی و نوع ورودی قفل شده‌اند/);
});

test('attribute mutations map controlled API errors instead of generic Server Error alerts', () => {
  assert.match(attributePage, /catalogAdminErrorMessage/);
  assert.match(optionManager, /catalogAdminErrorMessage/);
  assert.match(categoryManager, /catalogAdminErrorMessage/);
  assert.doesNotMatch(attributePage + optionManager + categoryManager, /alert\s*\(/);
  assert.doesNotMatch(attributePage + optionManager + categoryManager, /Server Error/);
});

test('option manager supports add, edit, deactivate, reactivate, ordering, and color swatches', () => {
  assert.match(optionManager, /method: editingId \? 'PATCH' : 'POST'/);
  assert.match(optionManager, /isActive: !option\.isActive/);
  assert.match(optionManager, /sortOrder: Number\(form\.sortOrder\)/);
  assert.match(optionManager, /swatchHex/);
  assert.match(optionManager, /#000000/);
  assert.match(optionManager, /غیرفعال/);
  assert.match(optionManager, /فعال/);
});

test('category assignment UI covers assignment, duplicate-safe choices, flags, order, and safe removal', () => {
  assert.match(categoryManager, /!assignedIds\.has\(attribute\.id\)/);
  for (const field of ['isRequired', 'isVariantDefining', 'allowsMultiple', 'sortOrder']) {
    assert.match(categoryManager, new RegExp(field));
  }
  assert.match(categoryManager, /method: 'POST'/);
  assert.match(categoryManager, /method: 'PATCH'/);
  assert.match(categoryManager, /method: 'DELETE'/);
  assert.match(categoryManager, /حذف تخصیص/);
});

test('category UI explains variant and multiple-value semantics without implementing variants', () => {
  assert.match(categoryManager, /چند مقدار موجود داشته باشد؛ نه اینکه مشتری برای یک واحد چند مقدار انتخاب کند/);
  assert.match(categoryManager, /هیچ Variant یا موجودی ایجاد نمی‌کند/);
  assert.match(categoryManager, /!canDefineVariants\(assignment\.attribute\.inputType\)/);
});

test('Admin navigation and page layout require the existing Categories permission', () => {
  const navigation = read('src/config/adminNavigation.js');
  const sidebar = read('src/components/admin/AdminSidebar.js');
  const layout = read('src/app/admin/attributes/layout.js');
  assert.match(navigation, /attributes: '\/admin\/attributes'/);
  assert.match(sidebar, /ADMIN_ROUTES\.attributes/);
  assert.match(sidebar, /CATEGORIES_MANAGE/);
  assert.match(layout, /AdminPermissionGate/);
  assert.match(layout, /CATEGORIES_MANAGE/);
});

test('Phase 2A APIs remain the sole authenticated mutation boundary', () => {
  const routes = [
    'src/app/api/admin/catalog-attributes/route.js',
    'src/app/api/admin/catalog-attributes/[id]/route.js',
    'src/app/api/admin/catalog-attributes/[id]/options/route.js',
    'src/app/api/admin/attribute-options/[id]/route.js',
    'src/app/api/admin/categories/[id]/attributes/route.js',
    'src/app/api/admin/categories/[id]/attributes/[attributeId]/route.js',
  ].map(read).join('\n');
  assert.match(routes, /authorizeAdminApiRequest/);
  assert.match(routes, /ADMIN_PERMISSIONS\.CATEGORIES_MANAGE/);
  assert.match(attributePage + optionManager + categoryManager, /\/api\/admin\/catalog-attributes/);
  assert.match(categoryManager, /\/api\/admin\/categories/);
});

test('responsive UI contains overflow, switches to mobile cards, and supports target widths', () => {
  assert.match(adminCss, /overflow-x: auto/);
  assert.match(adminCss, /@media \(max-width: 820px\)/);
  assert.match(adminCss, /@media \(max-width: 640px\)/);
  assert.match(adminCss, /@media \(max-width: 430px\)/);
  assert.match(adminCss, /\.desktopTable \{ display: none; \}/);
  assert.match(adminCss, /\.mobileList \{ display: block; \}/);
  assert.match(adminCss, /100dvh/);
});

test('Phase 2B adds no migration beyond the existing Phase 2A foundation', () => {
  const migrations = readdirSync(join(root, 'prisma/migrations'));
  assert.ok(migrations.includes('20260902000100_category_attribute_foundation'));
  assert.equal(migrations.some(name => /attribute_admin|phase_2b|category_attribute_ui/i.test(name)), false);
});
