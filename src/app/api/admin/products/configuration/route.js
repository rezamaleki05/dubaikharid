import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import {
  adminProductConfigurationApiError,
  readAdminProductConfigurationJson,
} from '@/lib/adminProductConfigurationApi';
import { normalizeAdminProductConfigurationPayload } from '@/lib/adminProductConfigurationDomain';
import { saveAdminProductConfiguration } from '@/lib/adminProductConfigurationService';
import { validateProductPayload } from '@/lib/adminProducts';
import { prisma } from '@/lib/prisma';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_CREATE);
  if (response) return response;
  const parsed = await readAdminProductConfigurationJson(request);
  if (parsed.response) return parsed.response;
  const normalized = normalizeAdminProductConfigurationPayload(parsed.body);
  if (normalized.error) return NextResponse.json({ error: normalized.error }, { status: 400 });
  const product = validateProductPayload(normalized.data.product, { allowSupplyPricing: true });
  if (product.error) return NextResponse.json({ error: product.error }, { status: 400 });
  try {
    const configured = await saveAdminProductConfiguration(prisma, {
      productData: product.data,
      attributeValues: normalized.data.attributeValues,
      variants: normalized.data.variants,
      adminId: admin.id,
    });
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_CONFIGURATION_CREATED',
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
    return NextResponse.json(configured, { status: 201 });
  } catch (error) {
    return adminProductConfigurationApiError(error, 'Admin Product configuration create failed:');
  }
}
