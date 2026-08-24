import { NextResponse } from 'next/server';
import { getPublicDiscovery } from '@/lib/publicCatalog';
import { publicRequestGuard } from '@/lib/publicRequestGuard';

export async function GET(request) {
  const guard = publicRequestGuard(request, { limit: 120 });
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { searchParams } = new URL(request.url);
  if ([...searchParams.keys()].some(key => !['search', 'category', 'limit'].includes(key))) {
    return NextResponse.json({ error: 'پارامتر ناشناخته در درخواست وجود دارد.' }, { status: 400 });
  }
  const limit = Number(searchParams.get('limit') || 60);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ error: 'محدوده درخواست معتبر نیست.' }, { status: 400 });
  }
  try {
    return NextResponse.json(await getPublicDiscovery({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      limit,
    }));
  } catch (error) {
    console.error('Error fetching public catalog discovery:', error);
    return NextResponse.json({ error: 'دریافت فهرست برندها و فروشگاه‌ها با خطا مواجه شد.' }, { status: 500 });
  }
}
