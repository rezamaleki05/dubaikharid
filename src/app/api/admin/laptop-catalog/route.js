import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.LAPTOPS_VIEW);
  if (response) return response;
  const brands = await prisma.brand.findMany({
    where: { supportsLaptop: true },
    select: {
      id: true, name: true, faName: true,
      laptopModels: { where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } },
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ data: brands });
}

export async function POST(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.LAPTOPS_EDIT);
  if (response) return response;
  let body;
  try { body = await request.json(); } catch { body = null; }
  const brandId = typeof body?.brandId === 'string' ? body.brandId.trim() : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!brandId || !name || brandId.length > 160 || name.length > 180) return NextResponse.json({ error: 'برند و مدل معتبر الزامی است.' }, { status: 400 });
  try {
    const brand = await prisma.brand.findFirst({ where: { id: brandId, supportsLaptop: true }, select: { id: true } });
    if (!brand) return NextResponse.json({ error: 'برند لپ‌تاپ پیدا نشد.' }, { status: 404 });
    const existing = await prisma.laptopModel.findFirst({ where: { brandId, name: { equals: name, mode: 'insensitive' } } });
    const model = existing || await prisma.laptopModel.create({ data: { brandId, name } });
    return NextResponse.json({ data: model, alreadyExists: Boolean(existing) }, { status: existing ? 200 : 201 });
  } catch (error) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'این مدل قبلاً ثبت شده است.' }, { status: 409 });
    console.error('Error saving laptop model:', error);
    return NextResponse.json({ error: 'ثبت مدل لپ‌تاپ با خطا مواجه شد.' }, { status: 500 });
  }
}
