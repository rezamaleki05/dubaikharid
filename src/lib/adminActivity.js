import 'server-only';

import { prisma } from '@/lib/prisma';

function getRequestIp(request) {
  const forwarded = request?.headers?.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request?.headers?.get('x-real-ip') || null;
}

export async function logAdminActivity({
  adminId = null,
  action,
  entityType = null,
  entityId = null,
  metadata = null,
  request = null,
}) {
  try {
    await prisma.adminActivityLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress: getRequestIp(request),
      },
    });
  } catch (error) {
    console.error('Failed to write admin activity log:', error);
  }
}
