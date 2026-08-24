import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

export async function PUT(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CATEGORIES_MANAGE);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        icon: body.icon,
        query: body.query,
        countText: body.count
      }
    });
    await logAdminActivity({ adminId: admin.id, action: 'CATEGORY_UPDATED', entityType: 'Category', entityId: id, request });
    revalidatePublicCatalog();
    return NextResponse.json({
      id: updatedCategory.id,
      name: updatedCategory.name,
      icon: updatedCategory.icon,
      query: updatedCategory.query,
      count: updatedCategory.countText
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CATEGORIES_MANAGE);
  if (response) return response;

  try {
    const { id } = await params;
    await prisma.category.delete({
      where: { id }
    });
    await logAdminActivity({ adminId: admin.id, action: 'CATEGORY_DELETED', entityType: 'Category', entityId: id, request });
    revalidatePublicCatalog();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
