'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import AttributeFormDialog from '@/components/admin/catalog/AttributeFormDialog';
import OptionManagerDialog from '@/components/admin/catalog/OptionManagerDialog';
import ui from '@/components/admin/catalog/CatalogAttributeAdmin.module.css';
import {
  ATTRIBUTE_FILTERS,
  canManageAttributeOptions,
  catalogAdminErrorMessage,
  filterAndSortCatalogAttributes,
  getAttributeTypeMeta,
} from '@/lib/catalogAttributeAdminUi';

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [editingAttribute, setEditingAttribute] = useState(undefined);
  const [optionAttribute, setOptionAttribute] = useState(null);
  const [message, setMessage] = useState(null);

  const loadAttributes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/catalog-attributes?includeInactive=true', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(catalogAdminErrorMessage(payload, 'دریافت ویژگی‌ها با خطا مواجه شد.'));
      setAttributes(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadAttributes, 0);
    return () => window.clearTimeout(timer);
  }, [loadAttributes]);

  const visibleAttributes = useMemo(
    () => filterAndSortCatalogAttributes(attributes, { query, status }),
    [attributes, query, status],
  );

  const saveAttribute = async form => {
    const editing = Boolean(editingAttribute);
    const response = await fetch(editing ? `/api/admin/catalog-attributes/${editingAttribute.id}` : '/api/admin/catalog-attributes', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(catalogAdminErrorMessage(payload, 'ذخیره ویژگی با خطا مواجه شد.'));
    await loadAttributes();
    setMessage({ type: 'success', text: editing ? 'تغییرات ویژگی ذخیره شد.' : 'ویژگی جدید ایجاد شد.' });
  };

  const toggleAttribute = async attribute => {
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/catalog-attributes/${attribute.id}`, {
        method: attribute.isActive ? 'DELETE' : 'PATCH',
        ...(attribute.isActive ? {} : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: true }),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(catalogAdminErrorMessage(payload, 'تغییر وضعیت ویژگی با خطا مواجه شد.'));
      await loadAttributes();
      setMessage({ type: 'success', text: attribute.isActive ? 'ویژگی غیرفعال شد و سوابق آن حفظ شد.' : 'ویژگی دوباره فعال شد.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const openOptions = attribute => {
    if (!canManageAttributeOptions(attribute.inputType)) return;
    setOptionAttribute(attribute);
  };

  const renderStatus = attribute => (
    <span className={`${ui.statusBadge} ${attribute.isActive ? ui.statusActive : ui.statusInactive}`}>
      <span className={ui.statusDot} />
      {attribute.isActive ? 'فعال' : 'غیرفعال'}
    </span>
  );

  const renderActions = attribute => (
    <div className={ui.actions}>
      <button type="button" className={ui.textButton} onClick={() => setEditingAttribute(attribute)}>ویرایش</button>
      {canManageAttributeOptions(attribute.inputType) && (
        <button type="button" className={ui.textButton} onClick={() => openOptions(attribute)}>گزینه‌ها</button>
      )}
      <button
        type="button"
        className={attribute.isActive ? ui.dangerButton : ui.secondaryButton}
        onClick={() => toggleAttribute(attribute)}
      >
        {attribute.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
      </button>
    </div>
  );

  return (
    <AdminShell activeTab="attributes">
      <main className={ui.page}>
        <header className={ui.pageHeader}>
          <div>
            <span className={ui.eyebrow}>CATALOG SETTINGS</span>
            <h1 className={ui.pageTitle}>ویژگی‌های کاتالوگ</h1>
            <p className={ui.pageDescription}>
              ویژگی‌های قابل استفاده در دسته‌بندی‌ها را تعریف کنید. گزینه‌ها و وضعیت غیرفعال بدون حذف سوابق مدیریت می‌شوند.
            </p>
          </div>
          <button type="button" className={ui.primaryButton} onClick={() => setEditingAttribute(null)}>+ تعریف ویژگی جدید</button>
        </header>

        {message && (
          <div className={message.type === 'error' ? ui.errorNotice : ui.successNotice} role={message.type === 'error' ? 'alert' : 'status'}>
            {message.text}
          </div>
        )}

        <section className={ui.surface} aria-label="فهرست ویژگی‌های کاتالوگ">
          <div className={ui.toolbar}>
            <div className={ui.searchWrap}>
              <span className={ui.searchIcon}>⌕</span>
              <input
                className={`${ui.field} ${ui.searchField}`}
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="جستجو با نام، کد یا نوع…"
                aria-label="جستجوی ویژگی‌ها"
              />
            </div>
            <div className={ui.filterGroup} aria-label="فیلتر وضعیت">
              {ATTRIBUTE_FILTERS.map(filter => (
                <button
                  key={filter.value}
                  type="button"
                  className={`${ui.filterButton} ${status === filter.value ? ui.filterButtonActive : ''}`}
                  onClick={() => setStatus(filter.value)}
                  aria-pressed={status === filter.value}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <span className={ui.countLabel}>{visibleAttributes.length} از {attributes.length} ویژگی</span>
          </div>

          {loading ? (
            <div className={ui.loadingState}>
              <div className={ui.loadingBars} aria-label="در حال دریافت ویژگی‌ها">
                <span className={ui.loadingBar} /><span className={ui.loadingBar} /><span className={ui.loadingBar} />
              </div>
            </div>
          ) : visibleAttributes.length === 0 ? (
            <div className={ui.emptyState}>
              <strong>ویژگی‌ای برای نمایش وجود ندارد</strong>
              جستجو یا فیلتر را تغییر دهید، یا یک ویژگی جدید تعریف کنید.
            </div>
          ) : (
            <>
              <div className={`${ui.tableScroll} ${ui.desktopTable}`}>
                <table className={ui.table}>
                  <thead>
                    <tr>
                      <th>نام فارسی / انگلیسی</th><th>کد</th><th>نوع</th><th>گزینه‌ها</th><th>وضعیت</th><th>ترتیب</th><th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAttributes.map(attribute => {
                      const type = getAttributeTypeMeta(attribute.inputType);
                      return (
                        <tr key={attribute.id}>
                          <td className={ui.nameCell}><strong>{attribute.nameFa}</strong><span>{attribute.nameEn}</span></td>
                          <td><span className={ui.code}>{attribute.code}</span></td>
                          <td><span className={ui.typeBadge}>{type.label}</span></td>
                          <td className={ui.numberCell}>{canManageAttributeOptions(attribute.inputType) ? attribute.options?.length || 0 : '—'}</td>
                          <td>{renderStatus(attribute)}</td>
                          <td className={ui.numberCell}>{attribute.sortOrder}</td>
                          <td>{renderActions(attribute)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className={ui.mobileList}>
                {visibleAttributes.map(attribute => {
                  const type = getAttributeTypeMeta(attribute.inputType);
                  return (
                    <article className={ui.mobileCard} key={attribute.id}>
                      <div className={ui.mobileCardTop}>
                        <div className={ui.nameCell}><strong>{attribute.nameFa}</strong><span>{attribute.nameEn}</span></div>
                        {renderStatus(attribute)}
                      </div>
                      <div className={ui.mobileCardMeta}>
                        <span className={ui.code}>{attribute.code}</span>
                        <span className={ui.typeBadge}>{type.label}</span>
                        <span className={ui.typeBadge}>ترتیب {attribute.sortOrder}</span>
                        {canManageAttributeOptions(attribute.inputType) && <span className={ui.typeBadge}>{attribute.options?.length || 0} گزینه</span>}
                      </div>
                      <div className={ui.mobileCardActions}>{renderActions(attribute)}</div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      {editingAttribute !== undefined && (
        <AttributeFormDialog
          attribute={editingAttribute}
          onClose={() => setEditingAttribute(undefined)}
          onSave={saveAttribute}
        />
      )}
      {optionAttribute && (
        <OptionManagerDialog
          attribute={optionAttribute}
          onClose={() => setOptionAttribute(null)}
          onChanged={loadAttributes}
        />
      )}
    </AdminShell>
  );
}
