'use client';

import { useEffect, useMemo, useState } from 'react';

async function readBrandResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'دریافت برندها با خطا مواجه شد.');
  return payload;
}

function mergeBrands(current, incoming) {
  const merged = new Map();
  for (const brand of [...current, ...incoming]) {
    if (brand?.id) merged.set(brand.id, brand);
  }
  return [...merged.values()].sort((a, b) => String(a.name).localeCompare(String(b.name), 'en'));
}

export default function AdminBrandSelector({
  brands,
  categoryId,
  value,
  onChange,
  onBrandsChange,
  disabled = false,
}) {
  const safeBrands = useMemo(() => (Array.isArray(brands) ? brands : []), [brands]);
  const [options, setOptions] = useState([]);
  const [showAllCategory, setShowAllCategory] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const showAll = Boolean(categoryId && showAllCategory === categoryId);

  useEffect(() => {
    if (!categoryId) return undefined;
    const controller = new AbortController();
    const query = showAll ? '' : `?categoryId=${encodeURIComponent(categoryId)}`;
    fetch(`/api/admin/brands${query}`, { cache: 'no-store', signal: controller.signal })
      .then(readBrandResponse)
      .then(payload => {
        const loaded = Array.isArray(payload) ? payload : [];
        const selected = safeBrands.find(brand => brand.id === value);
        setOptions(selected && !loaded.some(brand => brand.id === selected.id)
          ? mergeBrands(loaded, [selected])
          : loaded);
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          setOptions(value ? safeBrands.filter(brand => brand.id === value) : []);
          setFeedback(error.message || 'دریافت برندها با خطا مواجه شد.');
        }
      })
    return () => controller.abort();
  }, [categoryId, safeBrands, showAll, value]);

  const selectedBrand = options.find(brand => brand.id === value)
    || safeBrands.find(brand => brand.id === value);
  const selectedIsAssociated = !value
    || selectedBrand?.categories?.some(category => category.id === categoryId);
  const associationWarning = Boolean(categoryId && value && !selectedIsAssociated);

  const handleCreate = async () => {
    if (isSaving || !categoryId) return;
    const cleanName = name.trim();
    if (!cleanName) {
      setFeedback('نام برند الزامی است.');
      return;
    }
    setIsSaving(true);
    setFeedback('');
    try {
      const brand = await readBrandResponse(await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          categoryIds: [categoryId],
          quickCreate: true,
          showInBrandDirectory: false,
        }),
      }));
      const nextBrands = mergeBrands(safeBrands, [brand]);
      onBrandsChange?.(nextBrands);
      setOptions(current => mergeBrands(current, [brand]));
      onChange(brand.id);
      setName('');
      setIsCreating(false);
      setFeedback(brand.alreadyExists
        ? (brand.categoryLinked
          ? 'این برند از قبل وجود داشت، به دسته‌بندی متصل و انتخاب شد.'
          : 'این برند از قبل وجود داشت و انتخاب شد.')
        : 'برند جدید به دسته‌بندی متصل و انتخاب شد.');
    } catch (error) {
      setFeedback(error.message || 'ایجاد برند با خطا مواجه شد.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectorDisabled = disabled || isSaving || !categoryId;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '11px', color: '#8b92a5' }}>برند:</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        <select
          value={value || ''}
          onChange={event => {
            onChange(event.target.value);
            setFeedback('');
          }}
          disabled={selectorDisabled}
          style={{ flex: '1 1 150px', minWidth: 0, padding: '8px 12px', background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
        >
          {!categoryId ? (
            <option value="">ابتدا دسته‌بندی را انتخاب کنید</option>
          ) : (
            <>
              <option value="">بدون برند</option>
              {options.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}{brand.faName ? ` — ${brand.faName}` : ''}
                </option>
              ))}
            </>
          )}
        </select>
        <button
          type="button"
          disabled={selectorDisabled}
          onClick={() => {
            setIsCreating(current => !current);
            setFeedback('');
          }}
          style={{ padding: '8px 10px', border: '1px solid rgba(248,120,32,0.28)', borderRadius: '8px', background: 'rgba(248,120,32,0.08)', color: '#f87820', fontSize: '11px', fontWeight: '700', cursor: selectorDisabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
        >
          + افزودن برند جدید
        </button>
      </div>
      {categoryId && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#aeb5c5', fontSize: '10.5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showAll}
            onChange={event => setShowAllCategory(event.target.checked ? categoryId : '')}
            disabled={isSaving}
          />
          نمایش همه برندها
        </label>
      )}
      {associationWarning && (
        <p role="status" style={{ margin: 0, color: '#f59e0b', fontSize: '10.5px' }}>
          این برند در حال حاضر به این دسته‌بندی متصل نیست.
        </p>
      )}
      {isCreating && categoryId && (
        <div style={{ display: 'flex', gap: '8px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.025)' }}>
          <input
            autoFocus
            required
            maxLength={160}
            value={name}
            onChange={event => setName(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleCreate();
              }
            }}
            placeholder="نام برند *"
            disabled={isSaving}
            style={{ minWidth: 0, flex: 1, padding: '8px 10px', background: '#181b24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: '#fff', fontSize: '12px', outline: 'none' }}
          />
          <button type="button" onClick={handleCreate} disabled={isSaving} style={{ padding: '8px 12px', border: 0, borderRadius: '7px', background: '#f87820', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: isSaving ? 'wait' : 'pointer' }}>
            {isSaving ? 'در حال ثبت…' : 'ثبت برند'}
          </button>
        </div>
      )}
      {feedback && <p role="status" style={{ margin: 0, fontSize: '10.5px', color: feedback.includes('خطا') || feedback.includes('الزامی') ? '#ef4444' : '#10b981' }}>{feedback}</p>}
    </div>
  );
}
