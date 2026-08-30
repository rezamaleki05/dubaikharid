import { NextResponse } from 'next/server';
import { getPublicWarehouseCatalog } from '@/lib/publicWarehouse';
import { publicRequestGuard } from '@/lib/publicRequestGuard';

export async function GET(request) {
  const guard = publicRequestGuard(request, { limit: 120 });
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { searchParams } = new URL(request.url);
  if ([...searchParams.keys()].some(key => !['page', 'limit', 'search'].includes(key))) {
    return NextResponse.json({ error: 'پارامتر ناشناخته است.' }, { status: 400 });
  }
  try {
    return NextResponse.json(await getPublicWarehouseCatalog({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 24,
      search: searchParams.get('search') || '',
    }));
  } catch (error) {
    if (error?.message === 'INVALID_PAGINATION') return NextResponse.json({ error: 'صفحه‌بندی معتبر نیست.' }, { status: 400 });
    console.error('Error fetching public warehouse:', error);
    return NextResponse.json({ error: 'دریافت موجودی انبار با خطا مواجه شد.' }, { status: 500 });
  }
}
