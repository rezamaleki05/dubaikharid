import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest, authorizeAdminApiRequestAny } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import {
  createCatalogAttribute,
  listCatalogAttributes,
} from '@/lib/adminCatalogAttributeService';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { catalogAttributeApiError, parseIncludeInactive, readCatalogAttributeJson } from '@/lib/catalogAttributeApi';
import { validateCatalogAttributePayload } from '@/lib/catalogAttributeDomain';
import { prisma } from '@/lib/prisma';

const READ_PERMISSIONS = [ADMIN_PERMISSIONS.CATEGORIES_MANAGE, ADMIN_PERMISSIONS.PRODUCTS_VIEW];

export async function GET(request) {
  const { response } = await authorizeAdminApiRequestAny(request, READ_PERMISSIONS);
  if (response) return response;
  const { searchParams } = new URL(request.url);
  if ([...searchParams.keys()].some(key => key !== 'includeInactive')) {
    return NextResponse.json({ error: 'پارامتر ناشناخته در درخواست وجود دارد.' }, { status: 400 });
  }
  const includeInactive = parseIncludeInactive(searchParams);
  if (includeInactive.error) return NextResponse.json({ error: includeInactive.error }, { status: 400 });
  try {
    return NextResponse.json(await listCatalogAttributes(prisma, { includeInactive: includeInactive.value }));
  } catch (error) {
    return catalogAttributeApiError(error, 'Catalog attribute list failed:');
  }
}

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CATEGORIES_MANAGE);
  if (response) return response;
  const parsedBody = await readCatalogAttributeJson(request);
  if (parsedBody.response) return parsedBody.response;
  const validated = validateCatalogAttributePayload(parsedBody.body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const attribute = await createCatalogAttribute(prisma, validated.data);
    await logAdminActivity({
      adminId: admin.id,
      action: 'CATALOG_ATTRIBUTE_CREATED',
      entityType: 'CatalogAttribute',
      entityId: attribute.id,
      metadata: { code: attribute.code, inputType: attribute.inputType },
      request,
    });
    return NextResponse.json(attribute, { status: 201 });
  } catch (error) {
    return catalogAttributeApiError(error, 'Catalog attribute creation failed:');
  }
}
