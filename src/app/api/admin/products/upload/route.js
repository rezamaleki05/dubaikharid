import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { authorizeAdminApiRequestAny } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { validateProductImage } from '@/lib/productImageValidation';

export const runtime = 'nodejs';

const UPLOAD_PERMISSIONS = [ADMIN_PERMISSIONS.PRODUCTS_CREATE, ADMIN_PERMISSIONS.PRODUCTS_EDIT];

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequestAny(request, UPLOAD_PERMISSIONS);
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

  const validation = validateProductImage({ type: file.type, size: file.size, bytes });
  if (validation.error) return NextResponse.json({ error: validation.error }, { status: 400 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'فضای ذخیره‌سازی تصویر هنوز تنظیم نشده است.' }, { status: 503 });
  }

  const pathname = `products/${new Date().getUTCFullYear()}/${randomUUID()}.${validation.extension}`;
  try {
    const blob = await put(pathname, bytes, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: validation.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_IMAGE_UPLOADED',
      entityType: 'ProductImage',
      metadata: { pathname: blob.pathname, contentType: validation.type, size: file.size },
      request,
    });
    return NextResponse.json({ url: blob.url, filename: blob.pathname }, { status: 201 });
  } catch (error) {
    console.error('Product image upload failed:', error);
    return NextResponse.json({ error: 'آپلود تصویر در فضای ذخیره‌سازی با خطا مواجه شد.' }, { status: 500 });
  }
}
