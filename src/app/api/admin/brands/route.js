import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.BRANDS_MANAGE);
  if (response) return response;

  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.BRANDS_MANAGE);
  if (response) return response;

  try {
    const body = await request.json();
    const newBrand = await prisma.brand.create({
      data: {
        id: body.id,
        name: body.name,
        faName: body.faName,
        cat: body.cat,
        hasImage: body.hasImage || false,
        img: body.img,
        fallback: body.fallback,
        url: body.url
      }
    });
    await logAdminActivity({ adminId: admin.id, action: 'BRAND_CREATED', entityType: 'Brand', entityId: newBrand.id, request });
    revalidatePublicCatalog();
    return NextResponse.json(newBrand, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
