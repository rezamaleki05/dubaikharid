// Pagination is its own document; sorting/facets are not separate search intents.
export function collectionSeoState(path, query = {}) {
  const raw = query.page;
  const page = raw === undefined ? 1 : typeof raw === 'string' && /^[1-9]\d{0,5}$/.test(raw) ? Number(raw) : null;
  const hasFacets = Object.entries(query).some(([key, value]) => key !== 'page' && !key.startsWith('utm_') && value !== undefined && value !== '');
  return { page, path: page && page > 1 ? `${path}?page=${page}` : path, noindex: page === null || hasFacets };
}

export function collectionPageExists(page, totalPages) {
  return Number.isInteger(page) && page >= 1 && (page === 1 || page <= totalPages);
}
