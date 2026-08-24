import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

export async function PUT(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.BRANDS_MANAGE);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: {
        name: body.name,
        faName: body.faName,
        cat: body.cat,
        hasImage: body.hasImage || false,
        img: body.img,
        fallback: body.fallback,
        url: body.url
      }
    });
    await logAdminActivity({ adminId: admin.id, action: 'BRAND_UPDATED', entityType: 'Brand', entityId: id, request });
    revalidatePublicCatalog();
    return NextResponse.json(updatedBrand);
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.BRANDS_MANAGE);
  if (response) return response;

  try {
    const { id } = await params;
    await prisma.brand.delete({
      where: { id }
    });
    await logAdminActivity({ adminId: admin.id, action: 'BRAND_DELETED', entityType: 'Brand', entityId: id, request });
    revalidatePublicCatalog();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
