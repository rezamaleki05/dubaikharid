import { NextResponse } from 'next/server';
import { getPublicProduct } from '@/lib/publicCatalog';

export async function GET(_request, { params }) {
  const { id } = await params;
  if (typeof id !== 'string' || !id || id.length > 180) return NextResponse.json({ error: 'شناسه محصول معتبر نیست.' }, { status: 400 });
  try {
    const product = await getPublicProduct(id);
    if (!product) return NextResponse.json({ error: 'محصول پیدا نشد.' }, { status: 404 });
    return NextResponse.json({ ...product, colors: null, sizes: null });
  } catch (error) {
    console.error('Error fetching public product:', error);
    return NextResponse.json({ error: 'دریافت محصول با خطا مواجه شد.' }, { status: 500 });
  }
}
