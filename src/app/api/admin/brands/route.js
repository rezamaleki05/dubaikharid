import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdminApiRequestAny } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';
import { validateAdminEntityId, validateBrandCreatePayload } from '@/lib/adminBrands';
import {
  adminBrandInclude,
  BrandDomainError,
  createAdminBrand,
  serializeAdminBrand,
} from '@/lib/adminBrandService';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

const BRAND_READ_PERMISSIONS = [
  ADMIN_PERMISSIONS.BRANDS_MANAGE,
  ADMIN_PERMISSIONS.PRODUCTS_VIEW,
  ADMIN_PERMISSIONS.WAREHOUSE_VIEW,
];
const BRAND_CREATE_PERMISSIONS = [
  ADMIN_PERMISSIONS.BRANDS_MANAGE,
  ADMIN_PERMISSIONS.PRODUCTS_CREATE,
  ADMIN_PERMISSIONS.PRODUCTS_EDIT,
  ADMIN_PERMISSIONS.WAREHOUSE_EDIT,
];

export async function GET(request) {
  const { response } = await authorizeAdminApiRequestAny(request, BRAND_READ_PERMISSIONS);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    if ([...searchParams.keys()].some(key => key !== 'categoryId')) {
      return NextResponse.json({ error: 'پارامتر فیلتر برند معتبر نیست.' }, { status: 400 });
    }
    const rawCategoryId = searchParams.get('categoryId');
    const categoryId = rawCategoryId ? validateAdminEntityId(rawCategoryId, 'شناسه دسته‌بندی') : null;
    if (categoryId?.error) return NextResponse.json({ error: categoryId.error }, { status: 400 });
    const brands = await prisma.brand.findMany({
      where: categoryId ? { categoryMappings: { some: { categoryId: categoryId.value } } } : undefined,
      include: adminBrandInclude,
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(brands.map(serializeAdminBrand));
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequestAny(request, BRAND_CREATE_PERMISSIONS);
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 });
  }
  const validated = validateBrandCreatePayload(body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });

  try {
    const brand = await createAdminBrand(prisma, validated);
    await logAdminActivity({
      adminId: admin.id,
      action: 'BRAND_CREATED',
      entityType: 'Brand',
      entityId: brand.id,
      metadata: { source: 'admin_brand_create', categoryIds: validated.categoryIds || [] },
      request,
    });
    revalidatePublicCatalog();
    return NextResponse.json(
      serializeAdminBrand(brand),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof BrandDomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'شناسه برند قبلاً استفاده شده است.' }, { status: 409 });
    }
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'ایجاد برند با خطا مواجه شد.' }, { status: 500 });
  }
}
