import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest, authorizeAdminApiRequestAny } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { createAttributeOption, listAttributeOptions } from '@/lib/adminCatalogAttributeService';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { catalogAttributeApiError, parseIncludeInactive, readCatalogAttributeJson } from '@/lib/catalogAttributeApi';
import { validateAttributeOptionPayload, validateCatalogEntityId } from '@/lib/catalogAttributeDomain';
import { prisma } from '@/lib/prisma';

const READ_PERMISSIONS = [ADMIN_PERMISSIONS.CATEGORIES_MANAGE, ADMIN_PERMISSIONS.PRODUCTS_VIEW];

async function attributeId(params) {
  const { id } = await params;
  return validateCatalogEntityId(id, 'شناسه ویژگی');
}

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequestAny(request, READ_PERMISSIONS);
  if (response) return response;
  const id = await attributeId(params);
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  const { searchParams } = new URL(request.url);
  if ([...searchParams.keys()].some(key => key !== 'includeInactive')) {
    return NextResponse.json({ error: 'پارامتر ناشناخته در درخواست وجود دارد.' }, { status: 400 });
  }
  const includeInactive = parseIncludeInactive(searchParams);
  if (includeInactive.error) return NextResponse.json({ error: includeInactive.error }, { status: 400 });
  try {
    return NextResponse.json(await listAttributeOptions(prisma, id.value, { includeInactive: includeInactive.value }));
  } catch (error) {
    return catalogAttributeApiError(error, 'Attribute option list failed:');
  }
}

export async function POST(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CATEGORIES_MANAGE);
  if (response) return response;
  const id = await attributeId(params);
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  const parsedBody = await readCatalogAttributeJson(request);
  if (parsedBody.response) return parsedBody.response;
  const validated = validateAttributeOptionPayload(parsedBody.body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const option = await createAttributeOption(prisma, id.value, validated.data);
    await logAdminActivity({
      adminId: admin.id,
      action: 'ATTRIBUTE_OPTION_CREATED',
      entityType: 'AttributeOption',
      entityId: option.id,
      metadata: { attributeId: id.value, code: option.code },
      request,
    });
    return NextResponse.json(option, { status: 201 });
  } catch (error) {
    return catalogAttributeApiError(error, 'Attribute option creation failed:');
  }
}
