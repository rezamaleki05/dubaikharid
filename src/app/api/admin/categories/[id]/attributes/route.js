import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest, authorizeAdminApiRequestAny } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { assignCategoryAttribute, listCategoryAttributes } from '@/lib/adminCatalogAttributeService';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { catalogAttributeApiError, readCatalogAttributeJson } from '@/lib/catalogAttributeApi';
import { validateCatalogEntityId, validateCategoryAttributePayload } from '@/lib/catalogAttributeDomain';
import { prisma } from '@/lib/prisma';

const READ_PERMISSIONS = [ADMIN_PERMISSIONS.CATEGORIES_MANAGE, ADMIN_PERMISSIONS.PRODUCTS_VIEW];

async function categoryId(params) {
  const { id } = await params;
  return validateCatalogEntityId(id, 'شناسه دسته‌بندی');
}

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequestAny(request, READ_PERMISSIONS);
  if (response) return response;
  const id = await categoryId(params);
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  try {
    return NextResponse.json(await listCategoryAttributes(prisma, id.value));
  } catch (error) {
    return catalogAttributeApiError(error, 'Category attribute list failed:');
  }
}

export async function POST(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CATEGORIES_MANAGE);
  if (response) return response;
  const id = await categoryId(params);
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  const parsedBody = await readCatalogAttributeJson(request);
  if (parsedBody.response) return parsedBody.response;
  const validated = validateCategoryAttributePayload(parsedBody.body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const assignment = await assignCategoryAttribute(prisma, id.value, validated.data);
    await logAdminActivity({
      adminId: admin.id,
      action: 'CATEGORY_ATTRIBUTE_ASSIGNED',
      entityType: 'CategoryAttribute',
      entityId: assignment.id,
      metadata: { categoryId: id.value, attributeId: assignment.attributeId },
      request,
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    return catalogAttributeApiError(error, 'Category attribute assignment failed:');
  }
}
