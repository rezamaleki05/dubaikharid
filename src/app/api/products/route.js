import { NextResponse } from 'next/server';
import { getPublicCatalog, getPublicDiscovery } from '@/lib/publicCatalog';
import { publicRequestGuard } from '@/lib/publicRequestGuard';

const BOOLEAN_VALUES = new Set(['true', 'false']);
const ALLOWED_PARAMS = new Set(['page', 'limit', 'scope', 'category', 'brand', 'store', 'search', 'sort', 'sale', 'bestSeller']);

function booleanParam(value) {
  if (value === null) return false;
  return BOOLEAN_VALUES.has(value) ? value === 'true' : null;
}

export async function GET(request) {
  const guard = publicRequestGuard(request, { limit: 120 });
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { searchParams } = new URL(request.url);
  if ([...searchParams.keys()].some(key => !ALLOWED_PARAMS.has(key))) {
    return NextResponse.json({ error: 'پارامتر ناشناخته در درخواست وجود دارد.' }, { status: 400 });
  }
  const sale = booleanParam(searchParams.get('sale'));
  const bestSeller = booleanParam(searchParams.get('bestSeller'));
  if (sale === null || bestSeller === null) {
    return NextResponse.json({ error: 'پارامتر بولی معتبر نیست.' }, { status: 400 });
  }

  const brands = (searchParams.get('brand') || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  try {
    const options = {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 24,
      scope: searchParams.get('scope') || 'all',
      category: searchParams.get('category') || '',
      brands,
      store: searchParams.get('store') || '',
      search: searchParams.get('search') || '',
      sort: searchParams.get('sort') || 'newest',
      sale,
      bestSeller,
    };
    const [catalog, discovery] = await Promise.all([
      getPublicCatalog(options),
      options.search ? getPublicDiscovery({ search: options.search, limit: 24 }) : Promise.resolve(null),
    ]);
    return NextResponse.json({ ...catalog, ...(discovery ? { discovery } : {}) });
  } catch (error) {
    if (error?.message === 'INVALID_PAGINATION') {
      return NextResponse.json({ error: 'پارامترهای صفحه‌بندی معتبر نیستند.' }, { status: 400 });
    }
    if (error?.message === 'INVALID_FILTER') {
      return NextResponse.json({ error: 'پارامترهای فیلتر محصول معتبر نیستند.' }, { status: 400 });
    }
    console.error('Error fetching public products:', error);
    return NextResponse.json({ error: 'دریافت محصولات با خطا مواجه شد.' }, { status: 500 });
  }
}
