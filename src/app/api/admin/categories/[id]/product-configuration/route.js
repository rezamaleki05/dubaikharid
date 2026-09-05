import { NextResponse } from 'next/server';
import { authorizeAdminApiRequestAny } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import {
  adminProductConfigurationApiError,
} from '@/lib/adminProductConfigurationApi';
import {
  getAdminCategoryProductConfiguration,
} from '@/lib/adminProductConfigurationService';
import { validateCatalogEntityId } from '@/lib/catalogAttributeDomain';
import { prisma } from '@/lib/prisma';

const READ_PERMISSIONS = [ADMIN_PERMISSIONS.CATEGORIES_MANAGE, ADMIN_PERMISSIONS.PRODUCTS_VIEW];

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequestAny(request, READ_PERMISSIONS);
  if (response) return response;
  const { id: rawId } = await params;
  const id = validateCatalogEntityId(rawId, 'شناسه دسته‌بندی');
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  try {
    return NextResponse.json(await getAdminCategoryProductConfiguration(prisma, id.value));
  } catch (error) {
    return adminProductConfigurationApiError(error, 'Admin category Product configuration read failed:');
  }
}
