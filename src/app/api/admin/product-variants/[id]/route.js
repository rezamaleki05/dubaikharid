import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { deactivateProductVariant, updateProductVariant } from '@/lib/adminProductVariantService';
import { prisma } from '@/lib/prisma';
import { productVariantApiError, readProductVariantJson } from '@/lib/productVariantApi';
import { validateProductVariantEntityId, validateUpdateProductVariantPayload } from '@/lib/productVariantDomain';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

async function variantId(params) {
  const { id } = await params;
  return validateProductVariantEntityId(id, 'شناسه تنوع');
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const id = await variantId(params);
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  const parsedBody = await readProductVariantJson(request);
  if (parsedBody.response) return parsedBody.response;
  const validated = validateUpdateProductVariantPayload(parsedBody.body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const variant = await updateProductVariant(prisma, id.value, validated.data);
    await logAdminActivity({
      adminId: admin.id,
      action: validated.data.isActive === false ? 'PRODUCT_VARIANT_DEACTIVATED' : 'PRODUCT_VARIANT_UPDATED',
      entityType: 'ProductVariant',
      entityId: variant.id,
      metadata: { changedFields: Object.keys(validated.data), optionSignature: variant.optionSignature },
      request,
    });
    revalidatePublicCatalog();
    return NextResponse.json(variant);
  } catch (error) {
    return productVariantApiError(error, 'Product variant update failed:');
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const id = await variantId(params);
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  try {
    const variant = await deactivateProductVariant(prisma, id.value);
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_VARIANT_DEACTIVATED',
      entityType: 'ProductVariant',
      entityId: variant.id,
      metadata: { optionSignature: variant.optionSignature },
      request,
    });
    revalidatePublicCatalog();
    return NextResponse.json(variant);
  } catch (error) {
    return productVariantApiError(error, 'Product variant deactivation failed:');
  }
}
