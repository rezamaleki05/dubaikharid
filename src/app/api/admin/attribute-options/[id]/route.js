import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { deactivateAttributeOption, updateAttributeOption } from '@/lib/adminCatalogAttributeService';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { catalogAttributeApiError, readCatalogAttributeJson } from '@/lib/catalogAttributeApi';
import { validateAttributeOptionPayload, validateCatalogEntityId } from '@/lib/catalogAttributeDomain';
import { prisma } from '@/lib/prisma';

async function optionId(params) {
  const { id } = await params;
  return validateCatalogEntityId(id, 'شناسه مقدار ویژگی');
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CATEGORIES_MANAGE);
  if (response) return response;
  const id = await optionId(params);
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  const parsedBody = await readCatalogAttributeJson(request);
  if (parsedBody.response) return parsedBody.response;
  const validated = validateAttributeOptionPayload(parsedBody.body, { partial: true });
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const option = await updateAttributeOption(prisma, id.value, validated.data);
    await logAdminActivity({
      adminId: admin.id,
      action: 'ATTRIBUTE_OPTION_UPDATED',
      entityType: 'AttributeOption',
      entityId: id.value,
      metadata: { changedFields: Object.keys(validated.data) },
      request,
    });
    return NextResponse.json(option);
  } catch (error) {
    return catalogAttributeApiError(error, 'Attribute option update failed:');
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CATEGORIES_MANAGE);
  if (response) return response;
  const id = await optionId(params);
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  try {
    const option = await deactivateAttributeOption(prisma, id.value);
    await logAdminActivity({
      adminId: admin.id,
      action: 'ATTRIBUTE_OPTION_DEACTIVATED',
      entityType: 'AttributeOption',
      entityId: id.value,
      metadata: { attributeId: option.attributeId, code: option.code },
      request,
    });
    return NextResponse.json(option);
  } catch (error) {
    return catalogAttributeApiError(error, 'Attribute option deactivation failed:');
  }
}
