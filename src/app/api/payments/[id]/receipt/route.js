import { NextResponse } from 'next/server';
import { authorizeCustomerPaymentRequest, serializeCustomerPayment } from '@/lib/manualPayments';
import { logAdminActivity } from '@/lib/adminActivity';
import { prisma } from '@/lib/prisma';
import { validatePaymentReceipt } from '@/lib/paymentReceiptValidation';
import { deletePrivatePaymentReceipt, readPrivatePaymentReceipt, ReceiptStorageConfigurationError, storePrivatePaymentReceipt } from '@/lib/paymentReceiptStorage';
import { publicRequestGuard } from '@/lib/publicRequestGuard';

export const runtime = 'nodejs';

function validId(id) { return typeof id === 'string' && id.length > 0 && id.length <= 160; }

async function loadPayment(id) {
  return prisma.payment.findUnique({ where: { id }, include: { order: { select: { id: true, orderCode: true, customerId: true, status: true } } } });
}

export async function GET(request, { params }) {
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: 'شناسه پرداخت معتبر نیست.' }, { status: 400 });
  const payment = await loadPayment(id);
  if (!payment?.receiptBlobPathname) return NextResponse.json({ error: 'رسید پیدا نشد.' }, { status: 404 });
  if (!(await authorizeCustomerPaymentRequest(request, payment))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const blob = await readPrivatePaymentReceipt(payment.receiptBlobPathname);
    if (!blob || blob.statusCode !== 200) return NextResponse.json({ error: 'رسید پیدا نشد.' }, { status: 404 });
    return new Response(blob.stream, {
      headers: {
        'Content-Type': payment.receiptMimeType || blob.blob.contentType || 'application/octet-stream',
        'Content-Length': String(payment.receiptSizeBytes || blob.blob.size || ''),
        'Content-Disposition': `inline; filename="receipt-${payment.id}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof ReceiptStorageConfigurationError) return NextResponse.json({ error: 'فضای خصوصی رسید تنظیم نشده است.' }, { status: 503 });
    console.error('Private receipt read failed:', error);
    return NextResponse.json({ error: 'دریافت رسید با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const guard = publicRequestGuard(request, { limit: 8, windowMs: 5 * 60_000 });
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: 'شناسه پرداخت معتبر نیست.' }, { status: 400 });
  const payment = await loadPayment(id);
  if (!payment) return NextResponse.json({ error: 'پرداخت پیدا نشد.' }, { status: 404 });
  if (!(await authorizeCustomerPaymentRequest(request, payment))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (payment.method !== 'CARD') return NextResponse.json({ error: 'آپلود رسید فقط برای پرداخت کارت‌به‌کارت مجاز است.' }, { status: 409 });
  if (!['pending', 'failed'].includes(payment.status) || payment.order?.status === 'cancelled') return NextResponse.json({ error: 'ارسال رسید در وضعیت فعلی مجاز نیست.' }, { status: 409 });

  let formData;
  try { formData = await request.formData(); } catch { formData = null; }
  const file = formData?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'فایل رسید انتخاب نشده است.' }, { status: 400 });
  let bytes;
  try { bytes = new Uint8Array(await file.arrayBuffer()); } catch { return NextResponse.json({ error: 'خواندن فایل رسید امکان‌پذیر نیست.' }, { status: 400 }); }
  const validation = validatePaymentReceipt({ type: file.type, size: file.size, bytes });
  if (validation.error) return NextResponse.json({ error: validation.error }, { status: 400 });

  let stored;
  try {
    stored = await storePrivatePaymentReceipt({ paymentId: payment.id, bytes, contentType: validation.type, extension: validation.extension });
    const updated = await prisma.$transaction(async tx => {
      const current = await tx.payment.findUnique({ where: { id: payment.id }, include: { order: { select: { status: true } } } });
      if (!current || !['pending', 'failed'].includes(current.status) || current.order?.status === 'cancelled') throw new Error('PAYMENT_CHANGED');
      return tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'pending',
          receiptBlobPathname: stored.pathname,
          receiptOriginalName: file.name.slice(0, 240) || 'receipt',
          receiptMimeType: validation.type,
          receiptSizeBytes: file.size,
          receiptSubmittedAt: new Date(),
          rejectionReason: null,
        },
      });
    }, { isolationLevel: 'Serializable' });
    if (payment.receiptBlobPathname && payment.receiptBlobPathname !== stored.pathname) {
      deletePrivatePaymentReceipt(payment.receiptBlobPathname).catch(error => console.error('Old receipt cleanup failed:', error));
    }
    await logAdminActivity({ action: payment.status === 'failed' ? 'PAYMENT_RECEIPT_RESUBMITTED' : 'PAYMENT_RECEIPT_SUBMITTED', entityType: 'Payment', entityId: payment.id, metadata: { orderId: payment.orderId, contentType: validation.type, size: file.size }, request });
    return NextResponse.json({ data: serializeCustomerPayment(updated) }, { status: 201 });
  } catch (error) {
    if (stored?.pathname) await deletePrivatePaymentReceipt(stored.pathname).catch(() => {});
    if (error instanceof ReceiptStorageConfigurationError) return NextResponse.json({ error: 'فضای خصوصی رسید تنظیم نشده است.' }, { status: 503 });
    if (error.message === 'PAYMENT_CHANGED') return NextResponse.json({ error: 'وضعیت پرداخت تغییر کرده است؛ صفحه را تازه کنید.' }, { status: 409 });
    console.error('Private receipt upload failed:', error);
    return NextResponse.json({ error: 'ارسال رسید با خطا مواجه شد.' }, { status: 500 });
  }
}
