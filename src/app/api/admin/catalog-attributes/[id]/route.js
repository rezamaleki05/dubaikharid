import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import {
  deactivateCatalogAttribute,
  updateCatalogAttribute,
} from '@/lib/adminCatalogAttributeService';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { catalogAttributeApiError, readCatalogAttributeJson } from '@/lib/catalogAttributeApi';
import { validateCatalogAttributePayload, validateCatalogEntityId } from '@/lib/catalogAttributeDomain';
import { prisma } from '@/lib/prisma';

async function attributeId(params) {
  const { id } = await params;
  return validateCatalogEntityId(id, 'شناسه ویژگی');
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CATEGORIES_MANAGE);
  if (response) return response;
  const id = await attributeId(params);
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  const parsedBody = await readCatalogAttributeJson(request);
  if (parsedBody.response) return parsedBody.response;
  const validated = validateCatalogAttributePayload(parsedBody.body, { partial: true });
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const attribute = await updateCatalogAttribute(prisma, id.value, validated.data);
    await logAdminActivity({
      adminId: admin.id,
      action: 'CATALOG_ATTRIBUTE_UPDATED',
      entityType: 'CatalogAttribute',
      entityId: id.value,
      metadata: { changedFields: Object.keys(validated.data) },
      request,
    });
    return NextResponse.json(attribute);
  } catch (error) {
    return catalogAttributeApiError(error, 'Catalog attribute update failed:');
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CATEGORIES_MANAGE);
  if (response) return response;
  const id = await attributeId(params);
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  try {
    const attribute = await deactivateCatalogAttribute(prisma, id.value);
    await logAdminActivity({
      adminId: admin.id,
      action: 'CATALOG_ATTRIBUTE_DEACTIVATED',
      entityType: 'CatalogAttribute',
      entityId: id.value,
      metadata: { code: attribute.code },
      request,
    });
    return NextResponse.json(attribute);
  } catch (error) {
    return catalogAttributeApiError(error, 'Catalog attribute deactivation failed:');
  }
}
