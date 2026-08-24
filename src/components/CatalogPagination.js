'use client';

export default function CatalogPagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <nav aria-label="صفحه‌بندی محصولات" dir="rtl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
      <button type="button" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.15)', background: 'transparent', color: '#fff', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? .45 : 1 }}>قبلی</button>
      <span style={{ color: '#aeb4c2', fontSize: '13px' }}>صفحه {pagination.page.toLocaleString('fa-IR')} از {pagination.totalPages.toLocaleString('fa-IR')}</span>
      <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.15)', background: 'transparent', color: '#fff', cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer', opacity: pagination.page >= pagination.totalPages ? .45 : 1 }}>بعدی</button>
    </nav>
  );
}
