import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { getTelegramConfiguration, telegramConnectionAction, telegramApiFailure } from '@/lib/telegram/service';
import { logAdminActivity } from '@/lib/adminActivity';
export const maxDuration = 60;
export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SETTINGS_VIEW);
  if (response) return response;
  try { return NextResponse.json(await getTelegramConfiguration()); }
  catch (error) { return NextResponse.json(telegramApiFailure(error), { status: 503 }); }
}
export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SETTINGS_EDIT);
  if (response) return response;
  const body = await request.json().catch(() => null);
  if (!body || Object.keys(body).some(key => !['action', 'confirm'].includes(key))
    || !['test-connection', 'test-message'].includes(body.action)
    || (body.action === 'test-message' && body.confirm !== true)) {
    return NextResponse.json({ error: 'عملیات یا تأیید ارسال معتبر نیست.' }, { status: 400 });
  }
  try {
    const result = await telegramConnectionAction(body.action);
    await logAdminActivity({ adminId: admin.id, action: 'TELEGRAM_' + body.action.toUpperCase().replaceAll('-', '_'), request });
    return NextResponse.json(result);
  } catch (error) { return NextResponse.json(telegramApiFailure(error), { status: 422 }); }
}
