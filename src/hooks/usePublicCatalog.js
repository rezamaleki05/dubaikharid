'use client';

import { useEffect, useMemo, useState } from 'react';

const EMPTY_PAGINATION = Object.freeze({ page: 1, limit: 24, total: 0, totalPages: 1 });
const EMPTY_DISCOVERY = Object.freeze({ brands: [], stores: [], categories: [] });

export function usePublicCatalog({
  scope = 'all', category = '', brands = [], store = '', search = '', sort = 'newest',
  sale = false, bestSeller = false, limit = 24, enabled = true,
} = {}) {
  const [pageState, setPageState] = useState({ filterKey: '', page: 1 });
  const [result, setResult] = useState({
    key: '', products: [], availableBrands: [], discovery: EMPTY_DISCOVERY,
    pagination: EMPTY_PAGINATION, error: '',
  });
  const brandKey = useMemo(() => [...brands].sort().join(','), [brands]);
  const filterKey = `${scope}|${category}|${brandKey}|${store}|${search}|${sort}|${sale}|${bestSeller}|${limit}`;
  const page = pageState.filterKey === filterKey ? pageState.page : 1;
  const requestKey = `${filterKey}|${page}`;
  const setPage = nextPage => setPageState({ filterKey, page: nextPage });

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: String(limit), scope, sort });
    if (category && category !== 'all') params.set('category', category);
    if (brandKey) params.set('brand', brandKey);
    if (store) params.set('store', store);
    if (search) params.set('search', search);
    if (sale) params.set('sale', 'true');
    if (bestSeller) params.set('bestSeller', 'true');

    fetch(`/api/products?${params}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'دریافت محصولات با خطا مواجه شد.');
        setResult({
          key: requestKey,
          products: Array.isArray(payload.data) ? payload.data : [],
          availableBrands: Array.isArray(payload.filters?.brands) ? payload.filters.brands : [],
          discovery: payload.discovery || EMPTY_DISCOVERY,
          pagination: payload.pagination || EMPTY_PAGINATION,
          error: '',
        });
      })
      .catch(fetchError => {
        if (fetchError.name === 'AbortError') return;
        setResult({
          key: requestKey, products: [], availableBrands: [], discovery: EMPTY_DISCOVERY,
          pagination: EMPTY_PAGINATION, error: fetchError.message || 'دریافت محصولات با خطا مواجه شد.',
        });
      });
    return () => controller.abort();
  }, [bestSeller, brandKey, category, enabled, limit, page, requestKey, sale, scope, search, sort, store]);

  if (!enabled) {
    return {
      products: [], availableBrands: [], discovery: EMPTY_DISCOVERY,
      pagination: EMPTY_PAGINATION, page: 1, setPage, loading: false, error: '',
    };
  }
  const current = result.key === requestKey;
  return {
    products: current ? result.products : [],
    availableBrands: current ? result.availableBrands : [],
    discovery: current ? result.discovery : EMPTY_DISCOVERY,
    pagination: current ? result.pagination : EMPTY_PAGINATION,
    page,
    setPage,
    loading: !current,
    error: current ? result.error : '',
  };
}
