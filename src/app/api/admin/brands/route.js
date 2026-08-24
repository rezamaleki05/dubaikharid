import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdminApiRequestAny } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';
import {
  resolveBrandCreateVisibility,
  validateAdminEntityId,
  validateBrandCreatePayload,
} from '@/lib/adminBrands';
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

const BRAND_INCLUDE = {
  categoryMappings: {
    include: { category: { select: { id: true, name: true, query: true } } },
    orderBy: { category: { name: 'asc' } },
  },
};

function serializeBrand(brand) {
  const { categoryMappings = [], ...data } = brand;
  return { ...data, categories: categoryMappings.map(mapping => mapping.category) };
}

async function assertCategoriesExist(client, categoryIds = []) {
  if (!categoryIds.length) return;
  const count = await client.category.count({ where: { id: { in: categoryIds } } });
  if (count !== categoryIds.length) throw Object.assign(new Error('CATEGORY_NOT_FOUND'), { code: 'CATEGORY_NOT_FOUND' });
}

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
      include: BRAND_INCLUDE,
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(brands.map(serializeBrand));
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
    const result = await prisma.$transaction(async tx => {
      // Serialize all creates through this endpoint because Brand.name has no unique constraint.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(742193)`;
      const matches = await tx.$queryRaw`
        SELECT "id" FROM "Brand"
        WHERE LOWER(BTRIM("name")) = LOWER(${validated.data.name})
        LIMIT 1
      `;
      const existing = matches[0]
        ? await tx.brand.findUnique({ where: { id: matches[0].id } })
        : null;
      await assertCategoriesExist(tx, validated.categoryIds);
      if (existing) {
        const existingMappingCount = validated.categoryIds?.length
          ? await tx.brandCategory.count({
            where: { brandId: existing.id, categoryId: { in: validated.categoryIds } },
          })
          : 0;
        for (const categoryId of validated.categoryIds || []) {
          await tx.brandCategory.upsert({
            where: { brandId_categoryId: { brandId: existing.id, categoryId } },
            create: { brandId: existing.id, categoryId },
            update: {},
          });
        }
        const brand = await tx.brand.findUnique({ where: { id: existing.id }, include: BRAND_INCLUDE });
        return {
          brand,
          created: false,
          categoryLinked: existingMappingCount < (validated.categoryIds?.length || 0),
        };
      }
      const brand = await tx.brand.create({
        data: {
          ...validated.data,
          showInBrandDirectory: resolveBrandCreateVisibility({
            quickCreate: validated.quickCreate,
            requestedVisibility: validated.data.showInBrandDirectory,
          }),
          ...(validated.categoryIds?.length ? {
            categoryMappings: { create: validated.categoryIds.map(categoryId => ({ categoryId })) },
          } : {}),
        },
        include: BRAND_INCLUDE,
      });
      return { brand, created: true, categoryLinked: Boolean(validated.categoryIds?.length) };
    }, { isolationLevel: 'Serializable' });

    if (result.created || result.categoryLinked) {
      await logAdminActivity({
        adminId: admin.id,
        action: result.created ? 'BRAND_CREATED' : 'BRAND_CATEGORY_LINKED',
        entityType: 'Brand',
        entityId: result.brand.id,
        metadata: {
          source: 'admin_brand_create',
          categoryIds: validated.categoryIds || [],
        },
        request,
      });
      revalidatePublicCatalog();
    }
    return NextResponse.json(
      {
        ...serializeBrand(result.brand),
        alreadyExists: !result.created,
        categoryLinked: result.categoryLinked,
      },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    if (error?.code === 'CATEGORY_NOT_FOUND') {
      return NextResponse.json({ error: 'دسته‌بندی انتخاب‌شده پیدا نشد.' }, { status: 404 });
    }
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'شناسه برند قبلاً استفاده شده است.' }, { status: 409 });
    }
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'ایجاد برند با خطا مواجه شد.' }, { status: 500 });
  }
}
