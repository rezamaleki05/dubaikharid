import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { createProductVariant, listProductVariants } from '@/lib/adminProductVariantService';
import { prisma } from '@/lib/prisma';
import { productVariantApiError, readProductVariantJson } from '@/lib/productVariantApi';
import {
  validateCreateProductVariantPayload,
  validateProductVariantEntityId,
} from '@/lib/productVariantDomain';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

async function productId(params) {
  const { id } = await params;
  return validateProductVariantEntityId(id, 'شناسه محصول');
}

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_VIEW);
  if (response) return response;
  const id = await productId(params);
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  try {
    return NextResponse.json({ variants: await listProductVariants(prisma, id.value) });
  } catch (error) {
    return productVariantApiError(error, 'Product variant list failed:');
  }
}

export async function POST(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const id = await productId(params);
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  const parsedBody = await readProductVariantJson(request);
  if (parsedBody.response) return parsedBody.response;
  const validated = validateCreateProductVariantPayload(parsedBody.body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const variant = await createProductVariant(prisma, { productId: id.value, data: validated.data });
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_VARIANT_CREATED',
      entityType: 'ProductVariant',
      entityId: variant.id,
      metadata: { productId: id.value, optionSignature: variant.optionSignature, isDefault: variant.isDefault },
      request,
    });
    revalidatePublicCatalog(id.value);
    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    return productVariantApiError(error, 'Product variant creation failed:');
  }
}
