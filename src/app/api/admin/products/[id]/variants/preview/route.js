import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { previewProductVariantCombinations } from '@/lib/adminProductVariantService';
import { prisma } from '@/lib/prisma';
import { productVariantApiError, readProductVariantJson } from '@/lib/productVariantApi';
import {
  validatePreviewProductVariantPayload,
  validateProductVariantEntityId,
} from '@/lib/productVariantDomain';

export async function POST(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const { id: rawId } = await params;
  const id = validateProductVariantEntityId(rawId, 'شناسه محصول');
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  const parsedBody = await readProductVariantJson(request);
  if (parsedBody.response) return parsedBody.response;
  const validated = validatePreviewProductVariantPayload(parsedBody.body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    return NextResponse.json(await previewProductVariantCombinations(prisma, {
      productId: id.value,
      combinations: validated.data.combinations,
    }));
  } catch (error) {
    return productVariantApiError(error, 'Product variant preview failed:');
  }
}
