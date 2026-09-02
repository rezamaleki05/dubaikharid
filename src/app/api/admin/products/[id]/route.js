import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { logAdminActivity } from '@/lib/adminActivity';
import {
  adminProductInclude,
  serializeAdminProduct,
  validateProductPayload,
  validateProductRelations,
} from '@/lib/adminProducts';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { checkProductCategoryAttributeCompatibility } from '@/lib/adminCatalogAttributeService';
import { prisma } from '@/lib/prisma';
import { revalidatePublicCatalog } from '@/lib/publicCatalogRevalidation';

function isValidProductId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 128;
}

export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_VIEW);
  if (response) return response;
  const { id } = await params;
  if (!isValidProductId(id)) return NextResponse.json({ error: 'شناسه محصول معتبر نیست.' }, { status: 400 });

  try {
    const product = await prisma.product.findUnique({ where: { id }, include: adminProductInclude });
    if (!product) return NextResponse.json({ error: 'محصول پیدا نشد.' }, { status: 404 });
    return NextResponse.json(serializeAdminProduct(product));
  } catch (error) {
    console.error('Error fetching admin product:', error);
    return NextResponse.json({ error: 'دریافت محصول با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_EDIT);
  if (response) return response;
  const { id } = await params;
  if (!isValidProductId(id)) return NextResponse.json({ error: 'شناسه محصول معتبر نیست.' }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 });
  }
  const validated = validateProductPayload(body, { partial: true });
  if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });

  try {
    const relationError = await validateProductRelations(prisma, validated.relationIds);
    if (relationError) return NextResponse.json({ error: relationError }, { status: 404 });

    const previous = await prisma.product.findUnique({
      where: { id },
      select: { id: true, status: true, categoryId: true },
    });
    if (!previous) return NextResponse.json({ error: 'محصول پیدا نشد.' }, { status: 404 });

    if (Object.hasOwn(validated.data, 'categoryId') && validated.data.categoryId !== previous.categoryId) {
      const compatibility = await checkProductCategoryAttributeCompatibility(prisma, {
        productId: id,
        newCategoryId: validated.data.categoryId,
      });
      if (compatibility.nonDefaultVariantCount > 0) {
        return NextResponse.json({
          error: 'پیش از تغییر دسته‌بندی، تنوع‌های گزینه‌دار محصول باید بازنگری شوند.',
          code: 'PRODUCT_CATEGORY_VARIANTS_IN_USE',
        }, { status: 409 });
      }
      if (!compatibility.compatible) {
        return NextResponse.json({
          error: 'مقادیر ویژگی محصول با دسته‌بندی جدید سازگار نیستند و باید ابتدا بازنگری شوند.',
          code: 'PRODUCT_CATEGORY_ATTRIBUTES_INCOMPATIBLE',
          invalidAttributeIds: compatibility.invalidAttributeIds,
        }, { status: 409 });
      }
    }

    const product = await prisma.product.update({ where: { id }, data: validated.data, include: adminProductInclude });
    const changedFields = Object.keys(validated.data).filter(key => key !== 'sourceUrlKey');
    const deactivated = validated.data.status === 'hidden' && previous.status !== 'hidden';
    await logAdminActivity({
      adminId: admin.id,
      action: deactivated ? 'PRODUCT_DEACTIVATED' : 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: id,
      metadata: {
        changedFields,
        ...(Object.hasOwn(validated.data, 'status') ? { previousStatus: previous.status, newStatus: product.status } : {}),
      },
      request,
    });
    revalidatePublicCatalog(product.id);
    return NextResponse.json(serializeAdminProduct(product));
  } catch (error) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'محصولی با این لینک، اسلاگ یا کد قبلاً ثبت شده است.' }, { status: 409 });
    }
    console.error('Error updating admin product:', error);
    return NextResponse.json({ error: 'به‌روزرسانی محصول با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.PRODUCTS_DELETE);
  if (response) return response;
  const { id } = await params;
  if (!isValidProductId(id)) return NextResponse.json({ error: 'شناسه محصول معتبر نیست.' }, { status: 400 });

  try {
    const previous = await prisma.product.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!previous) return NextResponse.json({ error: 'محصول پیدا نشد.' }, { status: 404 });
    if (previous.status === 'hidden') {
      return NextResponse.json({ error: 'این محصول قبلاً غیرفعال شده است.' }, { status: 409 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { status: 'hidden' },
      include: adminProductInclude,
    });
    await logAdminActivity({
      adminId: admin.id,
      action: 'PRODUCT_DEACTIVATED',
      entityType: 'Product',
      entityId: id,
      metadata: { previousStatus: previous.status, newStatus: 'hidden' },
      request,
    });
    revalidatePublicCatalog(product.id);
    return NextResponse.json(serializeAdminProduct(product));
  } catch (error) {
    console.error('Error deactivating admin product:', error);
    return NextResponse.json({ error: 'غیرفعال‌سازی محصول با خطا مواجه شد.' }, { status: 500 });
  }
}
