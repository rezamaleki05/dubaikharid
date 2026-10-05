import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { telegramProductStatus, sendProductToTelegram, telegramApiFailure } from '@/lib/telegram/service';
import { logAdminActivity } from '@/lib/adminActivity';
export const maxDuration = 60;
export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_VIEW);
  if (response) return response;
  const { id } = await params;
  if (!id || id.length > 128) return NextResponse.json({ error: 'شناسه معتبر نیست.' }, { status: 400 });
  try { return NextResponse.json(await telegramProductStatus(id)); }
  catch (error) { return NextResponse.json(telegramApiFailure(error), { status: 422 }); }
}
export async function POST(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!id || id.length > 128 || !body || Object.keys(body).some(key => !['expectedAttemptCount', 'confirmRepost'].includes(key))
    || !Number.isSafeInteger(body.expectedAttemptCount) || body.expectedAttemptCount < 0
    || (body.confirmRepost !== undefined && typeof body.confirmRepost !== 'boolean')) {
    return NextResponse.json({ error: 'درخواست ارسال معتبر نیست.' }, { status: 400 });
  }
  try {
    const publication = await sendProductToTelegram(id, body);
    await logAdminActivity({ adminId: admin.id, action: 'TELEGRAM_PRODUCT_SEND', entityType: 'Product', entityId: id,
      metadata: { publicationId: publication?.id, status: publication?.status }, request });
    return NextResponse.json({ publication });
  } catch (error) { return NextResponse.json(telegramApiFailure(error), { status: 422 }); }
}
