import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';
import { readPrivatePaymentReceipt, ReceiptStorageConfigurationError } from '@/lib/paymentReceiptStorage';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PAYMENTS_VIEW);
  if (response) return response;
  const { id } = await params;
  if (!id || id.length > 160) return NextResponse.json({ error: 'شناسه پرداخت معتبر نیست.' }, { status: 400 });
  const payment = await prisma.payment.findUnique({ where: { id }, select: { id: true, receiptBlobPathname: true, receiptMimeType: true, receiptSizeBytes: true } });
  if (!payment?.receiptBlobPathname) return NextResponse.json({ error: 'رسید پیدا نشد.' }, { status: 404 });
  try {
    const blob = await readPrivatePaymentReceipt(payment.receiptBlobPathname);
    if (!blob || blob.statusCode !== 200) return NextResponse.json({ error: 'رسید پیدا نشد.' }, { status: 404 });
    return new Response(blob.stream, { headers: { 'Content-Type': payment.receiptMimeType || blob.blob.contentType || 'application/octet-stream', 'Content-Length': String(payment.receiptSizeBytes || blob.blob.size || ''), 'Content-Disposition': `inline; filename="receipt-${payment.id}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    if (error instanceof ReceiptStorageConfigurationError) return NextResponse.json({ error: 'فضای خصوصی رسید تنظیم نشده است.' }, { status: 503 });
    console.error('Admin receipt read failed:', error);
    return NextResponse.json({ error: 'دریافت رسید با خطا مواجه شد.' }, { status: 500 });
  }
}
