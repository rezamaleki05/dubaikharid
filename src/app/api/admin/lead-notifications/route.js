import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';
import { getOwnerLeadConfiguration, ownerLeadTestAction } from '@/lib/leadNotifications/service';
import { safeLeadCode, LEAD_ERRORS } from '@/lib/leadNotifications/domain';
export const maxDuration = 60;
export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SETTINGS_VIEW);
  if (response) return response;
  try { return NextResponse.json(await getOwnerLeadConfiguration()); }
  catch { return NextResponse.json({ code: 'LEAD_NOTIFICATION_UNAVAILABLE' }, { status: 503 }); }
}
export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SETTINGS_EDIT);
  if (response) return response;
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || Object.keys(body).some(key => !['action', 'confirm'].includes(key))
    || !['verify', 'test'].includes(body.action)
    || (body.action === 'test' && body.confirm !== true)) {
    return NextResponse.json({ error: 'عملیات یا تأیید آزمایش معتبر نیست.' }, { status: 400 });
  }
  try {
    const result = await ownerLeadTestAction(body.action);
    await logAdminActivity({ adminId: admin.id, action: 'LEAD_NOTIFICATION_TEST',
      metadata: { provider: 'telegram', action: body.action, status: result.status || 'VERIFIED', code: result.code || null }, request });
    return NextResponse.json(result, { status: result.code ? 422 : 200 });
  } catch (error) {
    const code = safeLeadCode(error);
    return NextResponse.json({ code, error: LEAD_ERRORS[code] }, { status: 422 });
  }
}
