import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';
import { isOwnedBrandLogoPathname } from '@/lib/brandLogoOwnership';
import { deleteUnreferencedBrandLogos } from '@/lib/brandLogoStorage';
import { getProductBlobAuthOptions } from '@/lib/productImageStorage';
import { validateLaptopImage } from '@/lib/laptopImageValidation';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.BRANDS_MANAGE);
  if (response) return response;
  let formData;
  try { formData = await request.formData(); } catch { return NextResponse.json({ error: 'درخواست آپلود معتبر نیست.' }, { status: 400 }); }
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'فایل لوگو انتخاب نشده است.' }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateLaptopImage({ type: file.type, size: file.size, bytes });
  if (validation.error) return NextResponse.json({ error: validation.error }, { status: 400 });
  const auth = getProductBlobAuthOptions();
  if (!auth) return NextResponse.json({ error: 'فضای ذخیره‌سازی لوگو تنظیم نشده است.' }, { status: 503 });
  try {
    const pathname = `brands/${new Date().getUTCFullYear()}/${randomUUID()}.${validation.extension}`;
    const blob = await put(pathname, bytes, { access: 'public', addRandomSuffix: false, allowOverwrite: false, contentType: validation.type, ...auth });
    await logAdminActivity({ adminId: admin.id, action: 'BRAND_LOGO_UPLOADED', entityType: 'Brand', metadata: { pathname: blob.pathname, contentType: validation.type, size: file.size }, request });
    return NextResponse.json({ url: blob.url, blobPathname: blob.pathname }, { status: 201 });
  } catch (error) {
    console.error('Brand logo upload failed:', error);
    return NextResponse.json({ error: 'آپلود لوگو با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.BRANDS_MANAGE);
  if (response) return response;
  let body;
  try { body = await request.json(); } catch { body = null; }
  if (!body || Object.keys(body).some(key => key !== 'blobPathname') || !isOwnedBrandLogoPathname(body.blobPathname)) {
    return NextResponse.json({ error: 'مسیر لوگو معتبر نیست.' }, { status: 400 });
  }
  const result = await deleteUnreferencedBrandLogos(prisma, [body.blobPathname]);
  if (result.referenced.length) return NextResponse.json({ error: 'لوگو هنوز در حال استفاده است.' }, { status: 409 });
  if (!result.deleted.length) return NextResponse.json({ error: 'پاک‌سازی لوگو انجام نشد.' }, { status: 503 });
  return new NextResponse(null, { status: 204 });
}
