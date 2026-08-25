import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { getAdminAlertSummary } from '@/lib/adminAlerts';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.DASHBOARD_VIEW);
  if (response) return response;
  try {
    return NextResponse.json(await getAdminAlertSummary(), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Error fetching admin alerts:', error);
    return NextResponse.json({ error: 'دریافت هشدارهای مدیریت با خطا مواجه شد.' }, { status: 500 });
  }
}
