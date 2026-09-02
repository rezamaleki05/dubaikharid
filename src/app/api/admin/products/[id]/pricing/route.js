import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import {
  ProductSupplyPricingError,
  validateProductSupplyPricingPayload,
} from '@/lib/productSupplyPricingDomain';
import {
  getProductSupplyPricing,
  resolveAuthoritativeProductVariantPrice,
  serializeProductSupplyPricing,
  updateProductSupplyPricing,
} from '@/lib/productSupplyPricingService';
import { validateProductVariantEntityId } from '@/lib/productVariantDomain';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

async function readProductId(params) {
  const { id } = await params;
  return validateProductVariantEntityId(id, 'شناسه محصول');
}

function pricingError(error, context) {
  if (error instanceof ProductSupplyPricingError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  console.error(context, error);
  return NextResponse.json({ error: 'عملیات قیمت‌گذاری محصول انجام نشد.' }, { status: 500 });
}

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_VIEW);
  if (response) return response;
  const productId = await readProductId(params);
  if (productId.error) return NextResponse.json({ error: productId.error }, { status: 400 });
  const rawVariantId = new URL(request.url).searchParams.get('variantId');
  const variantId = rawVariantId ? validateProductVariantEntityId(rawVariantId, 'شناسه تنوع') : { value: null };
  if (variantId.error) return NextResponse.json({ error: variantId.error }, { status: 400 });
  try {
    const [product, resolvedPricing] = await Promise.all([
      getProductSupplyPricing(prisma, productId.value),
      resolveAuthoritativeProductVariantPrice(prisma, {
        productId: productId.value,
        variantId: variantId.value,
      }),
    ]);
    return NextResponse.json({ product, resolvedPricing });
  } catch (error) {
    return pricingError(error, 'Product pricing preview failed:');
  }
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const productId = await readProductId(params);
  if (productId.error) return NextResponse.json({ error: productId.error }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { body = null; }
  const validated = validateProductSupplyPricingPayload(body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
  try {
    const product = await updateProductSupplyPricing(prisma, productId.value, validated.data);
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_PRICING_UPDATED',
      entityType: 'Product',
      entityId: product.id,
      metadata: { changedFields: Object.keys(validated.data), supplyMode: product.supplyMode },
      request,
    });
    revalidatePublicCatalog(product.id);
    return NextResponse.json({ product: serializeProductSupplyPricing(product) });
  } catch (error) {
    return pricingError(error, 'Product supply pricing update failed:');
  }
}
