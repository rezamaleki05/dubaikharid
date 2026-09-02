'use client';

import { useMemo, useState } from 'react';
import { CatalogDialog, ToggleRow } from './CatalogDialog';
import ui from './CatalogAttributeAdmin.module.css';
import {
  ATTRIBUTE_TYPE_META,
  isAttributeIdentityLocked,
} from '@/lib/catalogAttributeAdminUi';

function initialForm(attribute) {
  return {
    nameFa: attribute?.nameFa || '',
    nameEn: attribute?.nameEn || '',
    code: attribute?.code || '',
    inputType: attribute?.inputType || 'SELECT',
    unitFa: attribute?.unitFa || '',
    unitEn: attribute?.unitEn || '',
    sortOrder: attribute?.sortOrder ?? 0,
    isActive: attribute?.isActive ?? true,
  };
}

export default function AttributeFormDialog({ attribute = null, onClose, onSave }) {
  const [form, setForm] = useState(() => initialForm(attribute));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const identityLocked = useMemo(() => isAttributeIdentityLocked(attribute), [attribute]);
  const editing = Boolean(attribute);

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = async event => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        sortOrder: Number(form.sortOrder),
        unitFa: form.unitFa.trim() || null,
        unitEn: form.unitEn.trim() || null,
      });
      onClose();
    } catch (saveError) {
      setError(saveError.message || 'ذخیره ویژگی با خطا مواجه شد.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CatalogDialog
      title={editing ? `ویرایش ویژگی «${attribute.nameFa}»` : 'تعریف ویژگی جدید'}
      description="نام‌های نمایشی را می‌توان بعداً ویرایش کرد؛ کد فنی هویت پایدار ویژگی است."
      onClose={onClose}
      footer={(
        <>
          <button type="button" className={ui.secondaryButton} onClick={onClose} disabled={saving}>انصراف</button>
          <button type="submit" form="catalog-attribute-form" className={ui.primaryButton} disabled={saving}>
            {saving ? 'در حال ذخیره…' : editing ? 'ذخیره تغییرات' : 'ایجاد ویژگی'}
          </button>
        </>
      )}
    >
      {error && <div className={ui.errorNotice} role="alert">{error}</div>}
      {identityLocked && (
        <div className={ui.notice}>
          این ویژگی دارای گزینه یا تخصیص دسته‌بندی است؛ برای حفظ هویت داده، کد فنی و نوع ورودی قفل شده‌اند.
        </div>
      )}
      <form id="catalog-attribute-form" className={ui.formGrid} onSubmit={submit}>
        <div className={ui.formGroup}>
          <label className={ui.label} htmlFor="attribute-name-fa">نام فارسی <span className={ui.required}>*</span></label>
          <input id="attribute-name-fa" className={ui.field} required maxLength={160} value={form.nameFa} onChange={event => update('nameFa', event.target.value)} />
        </div>
        <div className={ui.formGroup}>
          <label className={ui.label} htmlFor="attribute-name-en">نام انگلیسی <span className={ui.required}>*</span></label>
          <input id="attribute-name-en" className={ui.field} required maxLength={160} dir="ltr" value={form.nameEn} onChange={event => update('nameEn', event.target.value)} />
        </div>
        <div className={ui.formGroup}>
          <label className={ui.label} htmlFor="attribute-code">کد فنی <span className={ui.required}>*</span></label>
          <input
            id="attribute-code"
            className={`${ui.field} ${identityLocked ? ui.lockedField : ''}`}
            required
            dir="ltr"
            autoCapitalize="none"
            spellCheck="false"
            pattern="[a-z][a-z0-9_]{0,63}"
            value={form.code}
            onChange={event => update('code', event.target.value)}
            disabled={identityLocked}
          />
          <p className={ui.fieldHint}>فقط حروف کوچک انگلیسی، عدد و زیرخط؛ مانند eu_size</p>
        </div>
        <div className={ui.formGroup}>
          <label className={ui.label} htmlFor="attribute-type">نوع ورودی <span className={ui.required}>*</span></label>
          <select
            id="attribute-type"
            className={`${ui.select} ${identityLocked ? ui.lockedField : ''}`}
            value={form.inputType}
            onChange={event => update('inputType', event.target.value)}
            disabled={identityLocked}
          >
            {Object.entries(ATTRIBUTE_TYPE_META).map(([value, meta]) => (
              <option key={value} value={value}>{meta.label} — {value}</option>
            ))}
          </select>
        </div>
        <div className={ui.formGroup}>
          <label className={ui.label} htmlFor="attribute-unit-fa">واحد فارسی</label>
          <input id="attribute-unit-fa" className={ui.field} maxLength={40} value={form.unitFa} onChange={event => update('unitFa', event.target.value)} placeholder="مثلاً میلی‌لیتر" />
        </div>
        <div className={ui.formGroup}>
          <label className={ui.label} htmlFor="attribute-unit-en">واحد انگلیسی</label>
          <input id="attribute-unit-en" className={ui.field} maxLength={40} dir="ltr" value={form.unitEn} onChange={event => update('unitEn', event.target.value)} placeholder="e.g. ml" />
        </div>
        <div className={ui.formGroup}>
          <label className={ui.label} htmlFor="attribute-sort">ترتیب نمایش</label>
          <input id="attribute-sort" className={ui.field} type="number" min="0" max="100000" value={form.sortOrder} onChange={event => update('sortOrder', event.target.value)} />
        </div>
        <div className={ui.formGroup}>
          <ToggleRow
            checked={form.isActive}
            onChange={value => update('isActive', value)}
            title="ویژگی فعال باشد"
            description="ویژگی غیرفعال برای داده جدید قابل انتخاب نیست، اما سوابق آن باقی می‌ماند."
          />
        </div>
      </form>
    </CatalogDialog>
  );
}
