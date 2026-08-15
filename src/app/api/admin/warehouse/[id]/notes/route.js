import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

export async function POST(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.WAREHOUSE_EDIT);
  if (response) return response;
  const { id } = await params;
  if (typeof id !== 'string' || !id || id.length > 128) return NextResponse.json({ error: 'شناسه کالا معتبر نیست.' }, { status: 400 });
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 }); }
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > 2000) return NextResponse.json({ error: 'متن یادداشت باید بین ۱ تا ۲۰۰۰ کاراکتر باشد.' }, { status: 400 });
  try {
    const exists = await prisma.warehouseItem.findFirst({ where: { id, isArchived: false }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: 'کالای فعال انبار پیدا نشد.' }, { status: 404 });
    const note = await prisma.warehouseNote.create({
      data: { warehouseItemId: id, text, adminId: admin.id },
      include: { admin: { select: { id: true, email: true } } },
    });
    await logAdminActivity({ adminId: admin.id, action: 'WAREHOUSE_NOTE_CREATED', entityType: 'WarehouseItem', entityId: id, request });
    return NextResponse.json({ ...note, createdAt: note.createdAt.toISOString() }, { status: 201 });
  } catch (error) {
    console.error('Creating warehouse note failed:', error);
    return NextResponse.json({ error: 'ثبت یادداشت با خطا مواجه شد.' }, { status: 500 });
  }
}
