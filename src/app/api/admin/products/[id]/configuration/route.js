import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import {
  adminProductConfigurationApiError,
  readAdminProductConfigurationJson,
} from '@/lib/adminProductConfigurationApi';
import { normalizeAdminProductConfigurationPayload } from '@/lib/adminProductConfigurationDomain';
import {
  getAdminProductConfiguration,
  saveAdminProductConfiguration,
} from '@/lib/adminProductConfigurationService';
import { validateProductPayload } from '@/lib/adminProducts';
import { prisma } from '@/lib/prisma';
import { validateProductVariantEntityId } from '@/lib/productVariantDomain';
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
    return NextResponse.json(await getAdminProductConfiguration(prisma, id.value));
  } catch (error) {
    return adminProductConfigurationApiError(error, 'Admin Product configuration read failed:');
  }
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const id = await productId(params);
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  const parsed = await readAdminProductConfigurationJson(request);
  if (parsed.response) return parsed.response;
  const normalized = normalizeAdminProductConfigurationPayload(parsed.body);
  if (normalized.error) return NextResponse.json({ error: normalized.error }, { status: 400 });
  const product = validateProductPayload(normalized.data.product, { allowSupplyPricing: true });
  if (product.error) return NextResponse.json({ error: product.error }, { status: 400 });
  try {
    const configured = await saveAdminProductConfiguration(prisma, {
      productId: id.value,
      productData: product.data,
      attributeValues: normalized.data.attributeValues,
      variants: normalized.data.variants,
      adminId: admin.id,
    });
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_CONFIGURATION_UPDATED',
      entityType: 'Product',
      entityId: configured.product.id,
      metadata: {
        supplyMode: configured.product.supplyMode,
        variantCount: configured.variants.filter(variant => variant.isActive).length,
        attributeValueCount: configured.attributeValues.length,
      },
      request,
    });
    revalidatePublicCatalog(configured.product.id);
    return NextResponse.json(configured);
  } catch (error) {
    return adminProductConfigurationApiError(error, 'Admin Product configuration update failed:');
  }
}
