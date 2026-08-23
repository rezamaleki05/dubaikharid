import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { serializeAdminPurchaseRequest } from '@/lib/adminPurchaseRequests';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PURCHASE_REQUESTS_VIEW);
  if (response) return response;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.trim().slice(0, 120) || '';
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));
  const where = {};
  if (status) where.status = status;
  if (search) where.OR = [
    { requestCode: { contains: search, mode: 'insensitive' } },
    { productName: { contains: search, mode: 'insensitive' } },
    { customer: { is: { name: { contains: search, mode: 'insensitive' } } } },
    { customer: { is: { phone: { contains: search, mode: 'insensitive' } } } },
  ];
  try {
    const requests = await prisma.purchaseRequest.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true, phone: true, email: true } }, order: { select: { orderCode: true, payments: { select: { status: true, method: true } } } } },
    });
    return NextResponse.json({ data: requests.map(serializeAdminPurchaseRequest) });
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    return NextResponse.json({ error: 'دریافت درخواست‌های خرید با خطا مواجه شد.' }, { status: 500 });
  }
}
