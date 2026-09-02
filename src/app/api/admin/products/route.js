import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import {
  adminProductInclude,
  PRODUCT_STATUS_SET,
  serializeAdminProduct,
  slugifyProductName,
  validateProductPayload,
  validateProductRelations,
} from '@/lib/adminProducts';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { ensureDefaultProductVariant } from '@/lib/adminProductVariantService';
import { prisma } from '@/lib/prisma';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

function parsePositiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= maximum ? parsed : null;
}

async function createUniqueSlug(baseSlug) {
  let candidate = baseSlug;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const exists = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!exists) return candidate;
    candidate = `${baseSlug}-${attempt + 2}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_VIEW);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInteger(searchParams.get('page'), 1);
  const limit = parsePositiveInteger(searchParams.get('limit'), 20, 100);
  const search = searchParams.get('search')?.trim().slice(0, 160) || '';
  const status = searchParams.get('status')?.trim() || '';
  const brandId = searchParams.get('brandId')?.trim().slice(0, 128) || '';
  const categoryId = searchParams.get('categoryId')?.trim().slice(0, 128) || '';
  const storeId = searchParams.get('storeId')?.trim().slice(0, 128) || '';

  if (!page || !limit || (status && !PRODUCT_STATUS_SET.has(status))) {
    return NextResponse.json({ error: 'پارامترهای فیلتر محصول معتبر نیستند.' }, { status: 400 });
  }

  const where = {
    ...(status ? { status } : {}),
    ...(brandId ? { brandId } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(storeId ? { storeId } : {}),
  };
  if (search) {
    where.OR = [
      { nameFa: { contains: search, mode: 'insensitive' } },
      { nameEn: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { originalLink: { contains: search, mode: 'insensitive' } },
      { brand: { is: { name: { contains: search, mode: 'insensitive' } } } },
      { brand: { is: { faName: { contains: search, mode: 'insensitive' } } } },
      { category: { is: { name: { contains: search, mode: 'insensitive' } } } },
      { store: { is: { name: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  try {
    const countWhere = { ...where };
    delete countWhere.status;
    const [products, total, groupedStatuses, brands, categories, stores] = await Promise.all([
      prisma.product.findMany({
        where,
        include: adminProductInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
      prisma.product.groupBy({ by: ['status'], where: countWhere, _count: { _all: true } }),
      prisma.brand.findMany({ select: { id: true, name: true, faName: true }, orderBy: { name: 'asc' } }),
      prisma.category.findMany({ select: { id: true, name: true, query: true }, orderBy: { name: 'asc' } }),
      prisma.store.findMany({ select: { id: true, name: true, url: true }, orderBy: { name: 'asc' } }),
    ]);

    return NextResponse.json({
      data: products.map(serializeAdminProduct),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      statusCounts: Object.fromEntries(groupedStatuses.map(row => [row.status, row._count._all])),
      filters: { brands, categories, stores },
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json({ error: 'دریافت محصولات با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_CREATE);
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 });
  }

  const validated = validateProductPayload(body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });

  try {
    const relationError = await validateProductRelations(prisma, validated.relationIds);
    if (relationError) return NextResponse.json({ error: relationError }, { status: 404 });

    if (!Object.hasOwn(body, 'slug')) {
      validated.data.slug = await createUniqueSlug(slugifyProductName(validated.data.nameEn));
    }

    const product = await prisma.$transaction(async tx => {
      const created = await tx.product.create({ data: validated.data, include: adminProductInclude });
      await ensureDefaultProductVariant(tx, created.id);
      return created;
    }, { isolationLevel: 'Serializable' });
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product.id,
      metadata: {
        fields: Object.keys(validated.data).filter(key => !['sourceUrlKey'].includes(key)),
        status: product.status,
      },
      request,
    });
    revalidatePublicCatalog(product.id);
    return NextResponse.json(serializeAdminProduct(product), { status: 201 });
  } catch (error) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'محصولی با این لینک، اسلاگ یا کد قبلاً ثبت شده است.' }, { status: 409 });
    }
    console.error('Error creating admin product:', error);
    return NextResponse.json({ error: 'ایجاد محصول با خطا مواجه شد.' }, { status: 500 });
  }
}
