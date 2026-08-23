import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { getDashboardReport } from '@/lib/adminReporting';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.DASHBOARD_VIEW);
  if (response) return response;

  try {
    return NextResponse.json(await getDashboardReport(), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json({ error: 'دریافت اطلاعات داشبورد با خطا مواجه شد.' }, { status: 500 });
  }
}
