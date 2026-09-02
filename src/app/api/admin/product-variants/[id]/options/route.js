import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { replaceProductVariantOptions } from '@/lib/adminProductVariantService';
import { prisma } from '@/lib/prisma';
import { productVariantApiError, readProductVariantJson } from '@/lib/productVariantApi';
import {
  validateProductVariantEntityId,
  validateReplaceProductVariantOptionsPayload,
} from '@/lib/productVariantDomain';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

export async function PUT(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const { id: rawId } = await params;
  const id = validateProductVariantEntityId(rawId, 'شناسه تنوع');
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  const parsedBody = await readProductVariantJson(request);
  if (parsedBody.response) return parsedBody.response;
  const validated = validateReplaceProductVariantOptionsPayload(parsedBody.body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const variant = await replaceProductVariantOptions(prisma, id.value, validated.data.optionIds);
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_VARIANT_OPTIONS_REPLACED',
      entityType: 'ProductVariant',
      entityId: variant.id,
      metadata: { optionSignature: variant.optionSignature, optionCount: variant.options.length },
      request,
    });
    revalidatePublicCatalog();
    return NextResponse.json(variant);
  } catch (error) {
    return productVariantApiError(error, 'Product variant option replacement failed:');
  }
}
