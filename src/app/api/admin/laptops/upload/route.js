import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { isOwnedLaptopBlobPathname } from '@/lib/laptopImageOwnership';
import {
  deleteUnreferencedLaptopBlobs,
  getLaptopBlobAuthOptions,
} from '@/lib/laptopImageStorage';
import { validateLaptopImage } from '@/lib/laptopImageValidation';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.LAPTOPS_EDIT);
  if (response) return response;

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'درخواست آپلود تصویر معتبر نیست.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'فایل تصویر انتخاب نشده است.' }, { status: 400 });
  }

  let bytes;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: 'خواندن فایل تصویر امکان‌پذیر نیست.' }, { status: 400 });
  }

  const validation = validateLaptopImage({ type: file.type, size: file.size, bytes });
  if (validation.error) return NextResponse.json({ error: validation.error }, { status: 400 });

  const blobAuth = getLaptopBlobAuthOptions();
  if (!blobAuth) {
    return NextResponse.json({ error: 'فضای ذخیره‌سازی تصویر هنوز تنظیم نشده است.' }, { status: 503 });
  }

  const pathname = `laptops/${new Date().getUTCFullYear()}/${randomUUID()}.${validation.extension}`;
  try {
    const blob = await put(pathname, bytes, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: validation.type,
      ...blobAuth,
    });
    await logAdminActivity({
      adminId: admin.id,
      action: 'LAPTOP_IMAGE_UPLOADED',
      entityType: 'Laptop',
      metadata: { pathname: blob.pathname, contentType: validation.type, size: file.size },
      request,
    });
    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
      blobPathname: blob.pathname,
    }, { status: 201 });
  } catch (error) {
    console.error('Laptop image upload failed:', error);
    return NextResponse.json({ error: 'آپلود تصویر در فضای ذخیره‌سازی با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.LAPTOPS_EDIT);
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'درخواست پاک‌سازی تصویر معتبر نیست.' }, { status: 400 });
  }

  if (!body || Object.keys(body).some(key => key !== 'blobPathname')
    || !isOwnedLaptopBlobPathname(body.blobPathname)) {
    return NextResponse.json({ error: 'مسیر تصویر لپ‌تاپ برای پاک‌سازی معتبر نیست.' }, { status: 400 });
  }

  const cleanup = await deleteUnreferencedLaptopBlobs(prisma, [body.blobPathname]);
  if (cleanup.referenced.includes(body.blobPathname)) {
    return NextResponse.json({ error: 'تصویر ثبت‌شده در لپ‌تاپ قابل پاک‌سازی نیست.' }, { status: 409 });
  }
  if (!cleanup.deleted.includes(body.blobPathname)) {
    return NextResponse.json({ error: 'پاک‌سازی فایل آپلودشده کامل نشد.' }, { status: 503 });
  }

  await logAdminActivity({
    adminId: admin.id,
    action: 'LAPTOP_IMAGE_ORPHAN_CLEANED',
    entityType: 'Laptop',
    metadata: { pathname: body.blobPathname },
    request,
  });
  return new NextResponse(null, { status: 204 });
}
