import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { removeCategoryAttribute, updateCategoryAttribute } from '@/lib/adminCatalogAttributeService';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { catalogAttributeApiError, readCatalogAttributeJson } from '@/lib/catalogAttributeApi';
import { validateCatalogEntityId, validateCategoryAttributePayload } from '@/lib/catalogAttributeDomain';
import { prisma } from '@/lib/prisma';

async function routeIds(params) {
  const values = await params;
  return {
    categoryId: validateCatalogEntityId(values.id, 'شناسه دسته‌بندی'),
    attributeId: validateCatalogEntityId(values.attributeId, 'شناسه ویژگی'),
  };
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CATEGORIES_MANAGE);
  if (response) return response;
  const ids = await routeIds(params);
  if (ids.categoryId.error || ids.attributeId.error) {
    return NextResponse.json({ error: ids.categoryId.error || ids.attributeId.error }, { status: 400 });
  }
  const parsedBody = await readCatalogAttributeJson(request);
  if (parsedBody.response) return parsedBody.response;
  if (Object.hasOwn(parsedBody.body || {}, 'attributeId')) {
    return NextResponse.json({ error: 'شناسه ویژگی این تخصیص قابل تغییر نیست.' }, { status: 400 });
  }
  const validated = validateCategoryAttributePayload(parsedBody.body, { partial: true });
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const assignment = await updateCategoryAttribute(
      prisma,
      ids.categoryId.value,
      ids.attributeId.value,
      validated.data,
    );
    await logAdminActivity({
      adminId: admin.id,
      action: 'CATEGORY_ATTRIBUTE_UPDATED',
      entityType: 'CategoryAttribute',
      entityId: assignment.id,
      metadata: { categoryId: ids.categoryId.value, attributeId: ids.attributeId.value, changedFields: Object.keys(validated.data) },
      request,
    });
    return NextResponse.json(assignment);
  } catch (error) {
    return catalogAttributeApiError(error, 'Category attribute update failed:');
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CATEGORIES_MANAGE);
  if (response) return response;
  const ids = await routeIds(params);
  if (ids.categoryId.error || ids.attributeId.error) {
    return NextResponse.json({ error: ids.categoryId.error || ids.attributeId.error }, { status: 400 });
  }
  try {
    const result = await removeCategoryAttribute(prisma, ids.categoryId.value, ids.attributeId.value);
    await logAdminActivity({
      adminId: admin.id,
      action: 'CATEGORY_ATTRIBUTE_REMOVED',
      entityType: 'CategoryAttribute',
      entityId: result.id,
      metadata: { categoryId: ids.categoryId.value, attributeId: ids.attributeId.value },
      request,
    });
    return NextResponse.json(result);
  } catch (error) {
    return catalogAttributeApiError(error, 'Category attribute removal failed:');
  }
}
