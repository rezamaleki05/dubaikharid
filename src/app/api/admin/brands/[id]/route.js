import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';
import { validateAdminEntityId, validateBrandUpdatePayload } from '@/lib/adminBrands';

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

export async function PUT(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.BRANDS_MANAGE);
  if (response) return response;

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 }); }
  const { id: rawId } = await params;
  const id = validateAdminEntityId(rawId, 'شناسه برند');
  if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
  const validated = validateBrandUpdatePayload(body);
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });

  try {
    const updatedBrand = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(742193)`;
      const existing = await tx.brand.findUnique({ where: { id: id.value }, select: { id: true } });
      if (!existing) throw Object.assign(new Error('BRAND_NOT_FOUND'), { code: 'BRAND_NOT_FOUND' });
      if (validated.categoryIds !== undefined) {
        const count = await tx.category.count({ where: { id: { in: validated.categoryIds } } });
        if (count !== validated.categoryIds.length) {
          throw Object.assign(new Error('CATEGORY_NOT_FOUND'), { code: 'CATEGORY_NOT_FOUND' });
        }
      }
      if (validated.data.name) {
        const duplicate = await tx.$queryRaw`
          SELECT "id" FROM "Brand"
          WHERE LOWER(BTRIM("name")) = LOWER(${validated.data.name})
            AND "id" <> ${id.value}
          LIMIT 1
        `;
        if (duplicate.length) throw Object.assign(new Error('BRAND_EXISTS'), { code: 'BRAND_EXISTS' });
      }
      await tx.brand.update({ where: { id: id.value }, data: validated.data });
      if (validated.categoryIds !== undefined) {
        await tx.brandCategory.deleteMany({ where: { brandId: id.value } });
        if (validated.categoryIds.length) {
          await tx.brandCategory.createMany({
            data: validated.categoryIds.map(categoryId => ({ brandId: id.value, categoryId })),
          });
        }
      }
      return tx.brand.findUnique({ where: { id: id.value }, include: BRAND_INCLUDE });
    }, { isolationLevel: 'Serializable' });
    await logAdminActivity({ adminId: admin.id, action: 'BRAND_UPDATED', entityType: 'Brand', entityId: id.value, request });
    revalidatePublicCatalog();
    return NextResponse.json(serializeBrand(updatedBrand));
  } catch (error) {
    if (error?.code === 'BRAND_NOT_FOUND') return NextResponse.json({ error: 'برند پیدا نشد.' }, { status: 404 });
    if (error?.code === 'CATEGORY_NOT_FOUND') return NextResponse.json({ error: 'یک یا چند دسته‌بندی پیدا نشد.' }, { status: 404 });
    if (error?.code === 'BRAND_EXISTS') return NextResponse.json({ error: 'برندی با این نام از قبل وجود دارد.' }, { status: 409 });
    console.error('Error updating brand:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.BRANDS_MANAGE);
  if (response) return response;

  try {
    const { id: rawId } = await params;
    const id = validateAdminEntityId(rawId, 'شناسه برند');
    if (id.error) return NextResponse.json({ error: id.error }, { status: 400 });
    await prisma.brand.delete({
      where: { id: id.value }
    });
    await logAdminActivity({ adminId: admin.id, action: 'BRAND_DELETED', entityType: 'Brand', entityId: id.value, request });
    revalidatePublicCatalog();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
