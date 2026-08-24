import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdminApiRequestAny } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';
import { validateBrandCreatePayload } from '@/lib/adminBrands';
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
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(brands);
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
      if (existing) return { brand: existing, created: false };
      return { brand: await tx.brand.create({ data: validated.data }), created: true };
    }, { isolationLevel: 'Serializable' });

    if (result.created) {
      await logAdminActivity({
        adminId: admin.id,
        action: 'BRAND_CREATED',
        entityType: 'Brand',
        entityId: result.brand.id,
        metadata: { source: 'admin_brand_create' },
        request,
      });
      revalidatePublicCatalog();
    }
    return NextResponse.json(
      { ...result.brand, alreadyExists: !result.created },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'شناسه برند قبلاً استفاده شده است.' }, { status: 409 });
    }
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'ایجاد برند با خطا مواجه شد.' }, { status: 500 });
  }
}
