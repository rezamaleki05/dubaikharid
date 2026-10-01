import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { refreshAedRate } from '@/lib/aedRateService';

// Backward-compatible protected alias. New Admin clients use the POST refresh route.
export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SETTINGS_EDIT);
  if (response) return response;
  const result = await refreshAedRate({ force: true });
  return NextResponse.json(
    result.updated
      ? { rate: Number(result.rate), lastUpdate: result.lastSuccessfulUpdate }
      : { error: result.error || 'دریافت نرخ ناموفق بود.' },
    { status: result.ok ? 200 : 502 },
  );
}
