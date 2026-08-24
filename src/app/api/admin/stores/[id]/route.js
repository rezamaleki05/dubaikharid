import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

export async function PUT(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.STORES_MANAGE);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const updatedStore = await prisma.store.update({
      where: { id },
      data: {
        name: body.name,
        desc: body.desc,
        url: body.url,
        img: body.img,
        fallback: body.fallback,
        hasImage: body.hasImage || false,
      }
    });
    await logAdminActivity({ adminId: admin.id, action: 'STORE_UPDATED', entityType: 'Store', entityId: id, request });
    revalidatePublicCatalog();
    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.STORES_MANAGE);
  if (response) return response;

  try {
    const { id } = await params;
    await prisma.store.delete({
      where: { id }
    });
    await logAdminActivity({ adminId: admin.id, action: 'STORE_DELETED', entityType: 'Store', entityId: id, request });
    revalidatePublicCatalog();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting store:', error);
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
  }
}
