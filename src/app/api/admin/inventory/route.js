import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { productInventoryApiError } from '@/lib/productInventoryApi';
import { listAdminProductInventory } from '@/lib/adminProductInventoryService';

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_VIEW);
  if (response) return response;
  const searchParams = new URL(request.url).searchParams;
  try {
    return NextResponse.json(await listAdminProductInventory(prisma, {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      categoryId: searchParams.get('categoryId'),
      brandId: searchParams.get('brandId'),
      productId: searchParams.get('productId'),
      location: searchParams.get('location'),
      status: searchParams.get('status'),
      sort: searchParams.get('sort'),
    }));
  } catch (error) {
    return productInventoryApiError(error, 'Admin product inventory list failed:');
  }
}
