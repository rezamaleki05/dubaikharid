import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.ACTIVITY_LOGS_VIEW);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get('adminId')?.trim();
  const action = searchParams.get('action')?.trim();
  const dateFrom = searchParams.get('dateFrom')?.trim();
  const dateTo = searchParams.get('dateTo')?.trim();
  const where = {};

  if (adminId) where.adminId = adminId;
  if (action) where.action = { contains: action, mode: 'insensitive' };

  const createdAt = {};
  if (dateFrom) {
    const parsed = new Date(`${dateFrom}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) createdAt.gte = parsed;
  }
  if (dateTo) {
    const parsed = new Date(`${dateTo}T23:59:59.999Z`);
    if (!Number.isNaN(parsed.getTime())) createdAt.lte = parsed;
  }
  if (Object.keys(createdAt).length) where.createdAt = createdAt;

  const logs = await prisma.adminActivityLog.findMany({
    where,
    include: { admin: { select: { id: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(logs);
}
