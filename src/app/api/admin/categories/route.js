import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CATEGORIES_MANAGE);
  if (response) return response;

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    // Map countText to count for the frontend
    const mapped = categories.map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      query: c.query,
      count: c.countText
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.CATEGORIES_MANAGE);
  if (response) return response;

  try {
    const body = await request.json();
    const newCategory = await prisma.category.create({
      data: {
        id: body.id,
        name: body.name,
        icon: body.icon,
        query: body.query,
        countText: body.count
      }
    });
    await logAdminActivity({ adminId: admin.id, action: 'CATEGORY_CREATED', entityType: 'Category', entityId: newCategory.id, request });
    return NextResponse.json({
      id: newCategory.id,
      name: newCategory.name,
      icon: newCategory.icon,
      query: newCategory.query,
      count: newCategory.countText
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
