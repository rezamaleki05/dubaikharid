'use client';

import { useCallback, useEffect, useState } from 'react';
import { CatalogDialog, ToggleRow } from './CatalogDialog';
import ui from './CatalogAttributeAdmin.module.css';
import { catalogAdminErrorMessage } from '@/lib/catalogAttributeAdminUi';

const EMPTY_OPTION = Object.freeze({ code: '', labelFa: '', labelEn: '', swatchHex: '', sortOrder: 0, isActive: true });

export default function OptionManagerDialog({ attribute, onClose, onChanged }) {
  const [options, setOptions] = useState([]);
  const [form, setForm] = useState(EMPTY_OPTION);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isColor = attribute.inputType === 'COLOR';

  const loadOptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/catalog-attributes/${attribute.id}/options?includeInactive=true`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(catalogAdminErrorMessage(payload, 'دریافت گزینه‌ها با خطا مواجه شد.'));
      setOptions(Array.isArray(payload) ? payload : []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [attribute.id]);

  useEffect(() => {
    const timer = window.setTimeout(loadOptions, 0);
    return () => window.clearTimeout(timer);
  }, [loadOptions]);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_OPTION);
    setError('');
  };
  const edit = option => {
    setEditingId(option.id);
    setForm({
      code: option.code,
      labelFa: option.labelFa,
      labelEn: option.labelEn,
      swatchHex: option.swatchHex || '',
      sortOrder: option.sortOrder,
      isActive: option.isActive,
    });
    setError('');
  };
  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const url = editingId
      ? `/api/admin/attribute-options/${editingId}`
      : `/api/admin/catalog-attributes/${attribute.id}/options`;
    try {
      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          labelFa: form.labelFa,
          labelEn: form.labelEn,
          ...(isColor ? { swatchHex: form.swatchHex.trim() || null } : {}),
          sortOrder: Number(form.sortOrder),
          isActive: Boolean(form.isActive),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(catalogAdminErrorMessage(payload, 'ذخیره گزینه با خطا مواجه شد.'));
      resetForm();
      await loadOptions();
      await onChanged();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };
  const toggleActive = async option => {
    setError('');
    try {
      const response = await fetch(`/api/admin/attribute-options/${option.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !option.isActive }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(catalogAdminErrorMessage(payload, 'تغییر وضعیت گزینه با خطا مواجه شد.'));
      await loadOptions();
      await onChanged();
    } catch (toggleError) {
      setError(toggleError.message);
    }
  };

  return (
    <CatalogDialog
      wide
      title={`گزینه‌های «${attribute.nameFa}»`}
      description={`${attribute.nameEn} · ${attribute.code} · گزینه‌های غیرفعال برای حفظ سوابق نمایش داده می‌شوند.`}
      onClose={onClose}
    >
      {error && <div className={ui.errorNotice} role="alert">{error}</div>}
      <section className={ui.optionComposer}>
        <div className={ui.sectionHeader}>
          <div>
            <h3>{editingId ? 'ویرایش گزینه' : 'افزودن گزینه'}</h3>
            <p>{isColor ? 'کد رنگ اختیاری است و باید مانند #000000 باشد.' : 'کد گزینه داخل همین ویژگی باید یکتا باشد.'}</p>
          </div>
          {editingId && <button type="button" className={ui.textButton} onClick={resetForm}>لغو ویرایش</button>}
        </div>
        <form className={ui.formGrid} onSubmit={submit}>
          <div className={ui.formGroup}>
            <label className={ui.label} htmlFor="option-label-fa">برچسب فارسی <span className={ui.required}>*</span></label>
            <input id="option-label-fa" className={ui.field} required maxLength={160} value={form.labelFa} onChange={event => setForm(current => ({ ...current, labelFa: event.target.value }))} />
          </div>
          <div className={ui.formGroup}>
            <label className={ui.label} htmlFor="option-label-en">برچسب انگلیسی <span className={ui.required}>*</span></label>
            <input id="option-label-en" className={ui.field} required dir="ltr" maxLength={160} value={form.labelEn} onChange={event => setForm(current => ({ ...current, labelEn: event.target.value }))} />
          </div>
          <div className={ui.formGroup}>
            <label className={ui.label} htmlFor="option-code">کد فنی <span className={ui.required}>*</span></label>
            <input id="option-code" className={ui.field} required dir="ltr" autoCapitalize="none" spellCheck="false" value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value }))} />
          </div>
          <div className={ui.formGroup}>
            <label className={ui.label} htmlFor="option-sort">ترتیب نمایش</label>
            <input id="option-sort" className={ui.field} type="number" min="0" max="100000" value={form.sortOrder} onChange={event => setForm(current => ({ ...current, sortOrder: event.target.value }))} />
          </div>
          {isColor && (
            <div className={ui.formGroup}>
              <label className={ui.label} htmlFor="option-swatch">کد رنگ</label>
              <input id="option-swatch" className={ui.field} dir="ltr" placeholder="#000000" pattern="#[0-9A-Fa-f]{6}" value={form.swatchHex} onChange={event => setForm(current => ({ ...current, swatchHex: event.target.value }))} />
            </div>
          )}
          <div className={ui.formGroup}>
            <ToggleRow checked={form.isActive} onChange={value => setForm(current => ({ ...current, isActive: value }))} title="گزینه فعال باشد" compact />
          </div>
          <div className={`${ui.formGroup} ${ui.formGroupWide}`}>
            <button type="submit" className={ui.primaryButton} disabled={saving}>{saving ? 'در حال ذخیره…' : editingId ? 'ذخیره گزینه' : 'افزودن گزینه'}</button>
          </div>
        </form>
      </section>

      <div className={ui.sectionHeader}>
        <div>
          <h3>فهرست گزینه‌ها</h3>
          <p>نمایش بر اساس ترتیب ثبت‌شده؛ برای تغییر ترتیب، عدد را ویرایش کنید.</p>
        </div>
        <span className={ui.countLabel}>{options.length} گزینه</span>
      </div>
      {loading ? (
        <div className={ui.loadingState}>در حال دریافت گزینه‌ها…</div>
      ) : options.length === 0 ? (
        <div className={ui.emptyState}><strong>هنوز گزینه‌ای تعریف نشده است</strong>اولین گزینه را از فرم بالا اضافه کنید.</div>
      ) : (
        <div className={ui.optionRows}>
          {options.map(option => (
            <div className={ui.optionRow} key={option.id}>
              {isColor ? (
                <span
                  className={`${ui.optionSwatch} ${option.swatchHex ? '' : ui.optionSwatchEmpty}`}
                  style={option.swatchHex ? { '--option-swatch': option.swatchHex } : undefined}
                  aria-label={option.swatchHex || 'بدون رنگ'}
                />
              ) : <span className={`${ui.optionSwatch} ${ui.optionSwatchEmpty}`} />}
              <div className={ui.optionName}>
                <strong>{option.labelFa}</strong>
                <span>{option.labelEn}</span>
              </div>
              <div className={ui.optionCode}>{option.code} · {option.sortOrder} · {option.isActive ? 'فعال' : 'غیرفعال'}</div>
              <div className={ui.optionActions}>
                <button type="button" className={ui.textButton} onClick={() => edit(option)}>ویرایش</button>
                <button type="button" className={option.isActive ? ui.dangerButton : ui.secondaryButton} onClick={() => toggleActive(option)}>
                  {option.isActive ? 'غیرفعال' : 'فعال'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CatalogDialog>
  );
}
