import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';
import { refreshAedRate } from '@/lib/aedRateService';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SETTINGS_EDIT);
  if (response) return response;
  const result = await refreshAedRate({ force: true });
  await logAdminActivity({ adminId: admin.id, action: result.updated ? 'EXCHANGE_RATE_UPDATED' : 'EXCHANGE_RATE_REFRESH_FAILED', entityType: 'Setting', entityId: 'aedRate', metadata: { source: 'manual_online_refresh', updated: result.updated, reason: result.reason || null }, request });
  return NextResponse.json({ data: result }, { status: result.ok ? 200 : 502 });
}
