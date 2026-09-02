'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CatalogDialog, ToggleRow } from './CatalogDialog';
import ui from './CatalogAttributeAdmin.module.css';
import {
  canDefineVariants,
  catalogAdminErrorMessage,
  getAttributeTypeMeta,
} from '@/lib/catalogAttributeAdminUi';

const EMPTY_ASSIGNMENT = Object.freeze({
  attributeId: '',
  isRequired: false,
  isVariantDefining: false,
  allowsMultiple: false,
  sortOrder: 0,
});

export default function CategoryAttributeManager({ category, onClose }) {
  const [attributes, setAttributes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(EMPTY_ASSIGNMENT);
  const [orderDrafts, setOrderDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [attributeResponse, assignmentResponse] = await Promise.all([
        fetch('/api/admin/catalog-attributes?includeInactive=true', { cache: 'no-store' }),
        fetch(`/api/admin/categories/${category.id}/attributes`, { cache: 'no-store' }),
      ]);
      const [attributePayload, assignmentPayload] = await Promise.all([
        attributeResponse.json().catch(() => ({})),
        assignmentResponse.json().catch(() => ({})),
      ]);
      if (!attributeResponse.ok) throw new Error(catalogAdminErrorMessage(attributePayload, 'دریافت ویژگی‌ها با خطا مواجه شد.'));
      if (!assignmentResponse.ok) throw new Error(catalogAdminErrorMessage(assignmentPayload, 'دریافت تنظیمات دسته‌بندی با خطا مواجه شد.'));
      const nextAssignments = Array.isArray(assignmentPayload) ? assignmentPayload : [];
      setAttributes(Array.isArray(attributePayload) ? attributePayload : []);
      setAssignments(nextAssignments);
      setOrderDrafts(Object.fromEntries(nextAssignments.map(item => [item.attributeId, item.sortOrder])));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [category.id]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const assignedIds = useMemo(() => new Set(assignments.map(item => item.attributeId)), [assignments]);
  const availableAttributes = useMemo(
    () => attributes.filter(attribute => attribute.isActive && !assignedIds.has(attribute.id)),
    [attributes, assignedIds],
  );
  const selectedAttribute = attributes.find(attribute => attribute.id === form.attributeId) || null;
  const selectedType = selectedAttribute ? getAttributeTypeMeta(selectedAttribute.inputType) : null;
  const selectedAllowsMultiple = ['MULTI_SELECT', 'COLOR'].includes(selectedAttribute?.inputType);

  const chooseAttribute = attributeId => {
    const attribute = attributes.find(item => item.id === attributeId);
    setForm(current => ({
      ...current,
      attributeId,
      isVariantDefining: attribute ? canDefineVariants(attribute.inputType) && current.isVariantDefining : false,
      allowsMultiple: attribute?.inputType === 'MULTI_SELECT' ? true : false,
    }));
    setError('');
    setSuccess('');
  };

  const assign = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/admin/categories/${category.id}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(catalogAdminErrorMessage(payload, 'تخصیص ویژگی با خطا مواجه شد.'));
      setForm(EMPTY_ASSIGNMENT);
      setSuccess('ویژگی به دسته‌بندی اضافه شد.');
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const updateAssignment = async (assignment, changes, message = 'تنظیمات ویژگی ذخیره شد.') => {
    setSavingId(assignment.attributeId);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/admin/categories/${category.id}/attributes/${assignment.attributeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(catalogAdminErrorMessage(payload, 'ویرایش تنظیمات ویژگی با خطا مواجه شد.'));
      setSuccess(message);
      await load();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setSavingId(null);
    }
  };

  const remove = async assignment => {
    setSavingId(assignment.attributeId);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/admin/categories/${category.id}/attributes/${assignment.attributeId}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(catalogAdminErrorMessage(payload, 'حذف تخصیص با خطا مواجه شد.'));
      setSuccess('تخصیص ویژگی از دسته‌بندی حذف شد.');
      await load();
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <CatalogDialog
      wide
      title={`ویژگی‌های دسته‌بندی «${category.name}»`}
      description="ترتیب این فهرست، ترتیب آینده فرم ثبت محصول را مشخص می‌کند."
      onClose={onClose}
    >
      {error && <div className={ui.errorNotice} role="alert">{error}</div>}
      {success && <div className={ui.successNotice} role="status">{success}</div>}
      {loading ? (
        <div className={ui.loadingState}>در حال دریافت تنظیمات دسته‌بندی…</div>
      ) : (
        <div className={ui.categoryManager}>
          <aside className={ui.assignmentComposer}>
            <div className={ui.sectionHeader}>
              <div>
                <h3>افزودن ویژگی</h3>
                <p>فقط ویژگی‌های فعال و تخصیص‌نیافته نمایش داده می‌شوند.</p>
              </div>
            </div>
            {availableAttributes.length === 0 ? (
              <div className={ui.emptyState}>
                <strong>ویژگی فعالی باقی نمانده است</strong>
                <Link href="/admin/attributes" className={ui.textButton}>مدیریت ویژگی‌های کاتالوگ</Link>
              </div>
            ) : (
              <form className={ui.formGrid} onSubmit={assign}>
                <div className={`${ui.formGroup} ${ui.formGroupWide}`}>
                  <label className={ui.label} htmlFor="category-attribute">ویژگی <span className={ui.required}>*</span></label>
                  <select id="category-attribute" required className={ui.select} value={form.attributeId} onChange={event => chooseAttribute(event.target.value)}>
                    <option value="">انتخاب کنید…</option>
                    {availableAttributes.map(attribute => (
                      <option key={attribute.id} value={attribute.id}>{attribute.nameFa} / {attribute.nameEn} — {attribute.code}</option>
                    ))}
                  </select>
                </div>
                {selectedAttribute && (
                  <div className={`${ui.notice} ${ui.formGroupWide}`}>
                    نوع ورودی: {selectedType.label}. {selectedType.supportsVariant ? 'قابل استفاده برای ساخت تنوع آینده.' : 'فقط اطلاعاتی و غیرقابل استفاده برای ساخت تنوع.'}
                  </div>
                )}
                <div className={`${ui.formGroup} ${ui.formGroupWide}`}>
                  <ToggleRow checked={form.isRequired} onChange={value => setForm(current => ({ ...current, isRequired: value }))} title="الزامی" description="محصول این دسته باید برای این ویژگی مقدار داشته باشد." />
                </div>
                <div className={`${ui.formGroup} ${ui.formGroupWide}`}>
                  <ToggleRow
                    checked={form.isVariantDefining}
                    onChange={value => setForm(current => ({ ...current, isVariantDefining: value }))}
                    title="سازنده تنوع"
                    description="این ویژگی بعداً در ساخت ترکیب‌های قابل فروش مانند رنگ + سایز استفاده می‌شود."
                    disabled={!selectedAttribute || !canDefineVariants(selectedAttribute.inputType)}
                  />
                </div>
                <div className={`${ui.formGroup} ${ui.formGroupWide}`}>
                  <ToggleRow
                    checked={form.allowsMultiple}
                    onChange={value => setForm(current => ({ ...current, allowsMultiple: value }))}
                    title="چند مقدار برای محصول"
                    description="یعنی محصول می‌تواند چند مقدار موجود داشته باشد؛ نه اینکه مشتری برای یک واحد چند مقدار انتخاب کند."
                    disabled={!selectedAttribute || !selectedAllowsMultiple || selectedAttribute.inputType === 'MULTI_SELECT'}
                  />
                </div>
                <div className={`${ui.formGroup} ${ui.formGroupWide}`}>
                  <label className={ui.label} htmlFor="category-attribute-sort">ترتیب نمایش</label>
                  <input id="category-attribute-sort" className={ui.field} type="number" min="0" max="100000" value={form.sortOrder} onChange={event => setForm(current => ({ ...current, sortOrder: event.target.value }))} />
                </div>
                <div className={`${ui.formGroup} ${ui.formGroupWide}`}>
                  <button className={ui.primaryButton} type="submit" disabled={saving || !form.attributeId}>{saving ? 'در حال افزودن…' : 'افزودن به دسته‌بندی'}</button>
                </div>
              </form>
            )}
          </aside>

          <section>
            <div className={ui.sectionHeader}>
              <div>
                <h3>ویژگی‌های این دسته‌بندی</h3>
                <p>وضعیت‌ها از API معتبر Phase 2A ذخیره می‌شوند.</p>
              </div>
              <span className={ui.countLabel}>{assignments.length} ویژگی</span>
            </div>
            {assignments.length === 0 ? (
              <div className={ui.emptyState}><strong>هنوز ویژگی‌ای تخصیص داده نشده است</strong>از بخش کناری، اولین ویژگی را اضافه کنید.</div>
            ) : (
              <div className={ui.assignmentList}>
                {assignments.map(assignment => {
                  const type = getAttributeTypeMeta(assignment.attribute.inputType);
                  const busy = savingId === assignment.attributeId;
                  const allowsMultipleSupported = ['MULTI_SELECT', 'COLOR'].includes(assignment.attribute.inputType);
                  return (
                    <article className={ui.assignmentCard} key={assignment.id}>
                      <div className={ui.assignmentHead}>
                        <div className={ui.assignmentName}>
                          <strong>{assignment.attribute.nameFa} / {assignment.attribute.nameEn}</strong>
                          <span>{assignment.attribute.code} · {type.label}{!assignment.attribute.isActive ? ' · ویژگی غیرفعال' : ''}</span>
                        </div>
                        <span className={ui.typeBadge}>ترتیب {assignment.sortOrder}</span>
                      </div>
                      <div className={ui.assignmentConfig}>
                        <ToggleRow compact checked={assignment.isRequired} onChange={value => updateAssignment(assignment, { isRequired: value })} title="الزامی" disabled={busy} />
                        <ToggleRow compact checked={assignment.isVariantDefining} onChange={value => updateAssignment(assignment, { isVariantDefining: value })} title="سازنده تنوع" disabled={busy || !canDefineVariants(assignment.attribute.inputType)} />
                        <ToggleRow compact checked={assignment.allowsMultiple} onChange={value => updateAssignment(assignment, { allowsMultiple: value })} title="چند مقدار" disabled={busy || !allowsMultipleSupported || assignment.attribute.inputType === 'MULTI_SELECT'} />
                        <input
                          className={`${ui.field} ${ui.orderField}`}
                          type="number"
                          min="0"
                          max="100000"
                          value={orderDrafts[assignment.attributeId] ?? assignment.sortOrder}
                          onChange={event => setOrderDrafts(current => ({ ...current, [assignment.attributeId]: event.target.value }))}
                          aria-label={`ترتیب ${assignment.attribute.nameFa}`}
                          disabled={busy}
                        />
                      </div>
                      <div className={ui.assignmentActions}>
                        <button type="button" className={ui.secondaryButton} disabled={busy || Number(orderDrafts[assignment.attributeId]) === assignment.sortOrder} onClick={() => updateAssignment(assignment, { sortOrder: Number(orderDrafts[assignment.attributeId]) }, 'ترتیب ویژگی ذخیره شد.')}>ذخیره ترتیب</button>
                        <button type="button" className={ui.dangerButton} disabled={busy} onClick={() => remove(assignment)}>حذف تخصیص</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <p className={ui.explanation}>
              «سازنده تنوع» فقط متادیتای مرحله آینده است و فعلاً هیچ Variant یا موجودی ایجاد نمی‌کند. ویژگی‌های متنی، عددی و بله/خیر نمی‌توانند سازنده تنوع باشند.
            </p>
          </section>
        </div>
      )}
    </CatalogDialog>
  );
}
