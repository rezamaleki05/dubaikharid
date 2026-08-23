import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request, { params }) {
  const { id } = await params;
  if (typeof id !== 'string' || !id || id.length > 180) return NextResponse.json({ error: 'شناسه محصول معتبر نیست.' }, { status: 400 });
  try {
    const product = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }], status: 'active' },
      select: {
        id: true, name: true, slug: true, priceAed: true, weight: true, originalLink: true,
        image: true, discountPercent: true, hasDiscount: true,
        brand: { select: { name: true, faName: true } },
        category: { select: { name: true } },
        store: { select: { name: true } },
      },
    });
    if (!product) return NextResponse.json({ error: 'محصول پیدا نشد.' }, { status: 404 });
    return NextResponse.json({
      id: product.id,
      productId: product.id,
      product_type: 'iran_inventory',
      name: product.name,
      slug: product.slug,
      priceAed: Number(product.priceAed),
      weight: product.weight,
      originalLink: product.originalLink || '',
      image: product.image || '',
      discountPercent: product.hasDiscount ? product.discountPercent : 0,
      brand: product.brand?.faName || product.brand?.name || '',
      category: product.category?.name || '',
      store: product.store?.name || 'فروشگاه دبی',
      colors: null,
      sizes: null,
      spec: product.category?.name || '',
    });
  } catch (error) {
    console.error('Error fetching public product:', error);
    return NextResponse.json({ error: 'دریافت محصول با خطا مواجه شد.' }, { status: 500 });
  }
}
