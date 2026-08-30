import { NextResponse } from 'next/server';
import { getPublicWarehouseItem } from '@/lib/publicWarehouse';

export async function GET(_request, { params }) {
  const { id } = await params;
  if (typeof id !== 'string' || !id || id.length > 180) return NextResponse.json({ error: 'شناسه معتبر نیست.' }, { status: 400 });
  try {
    const item = await getPublicWarehouseItem(id);
    if (!item) return NextResponse.json({ error: 'کالای انبار پیدا نشد.' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching public warehouse item:', error);
    return NextResponse.json({ error: 'دریافت کالای انبار با خطا مواجه شد.' }, { status: 500 });
  }
}
