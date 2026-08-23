import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.STORES_MANAGE);
  if (response) return response;

  try {
    const stores = await prisma.store.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.STORES_MANAGE);
  if (response) return response;

  try {
    const body = await request.json();
    const newStore = await prisma.store.create({
      data: {
        id: body.id,
        name: body.name,
        desc: body.desc,
        url: body.url,
        img: body.img,
        fallback: body.fallback,
        hasImage: body.hasImage || false,
      }
    });
    await logAdminActivity({ adminId: admin.id, action: 'STORE_CREATED', entityType: 'Store', entityId: newStore.id, request });
    return NextResponse.json(newStore, { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }
}
