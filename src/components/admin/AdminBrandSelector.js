'use client';

import { useState } from 'react';

async function readBrandResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'ایجاد برند با خطا مواجه شد.');
  return payload;
}

export default function AdminBrandSelector({ brands, value, onChange, onBrandsChange, disabled = false }) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const safeBrands = Array.isArray(brands) ? brands : [];

  const handleCreate = async () => {
    if (isSaving) return;
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
        body: JSON.stringify({ name: cleanName }),
      }));
      const nextBrands = [...safeBrands.filter(item => item.id !== brand.id), brand]
        .sort((a, b) => String(a.name).localeCompare(String(b.name), 'en'));
      onBrandsChange(nextBrands);
      onChange(brand.id);
      setName('');
      setIsCreating(false);
      setFeedback(brand.alreadyExists
        ? 'این برند از قبل وجود دارد و انتخاب شد.'
        : 'برند جدید ایجاد و انتخاب شد.');
    } catch (error) {
      setFeedback(error.message || 'ایجاد برند با خطا مواجه شد.');
    } finally {
      setIsSaving(false);
    }
  };

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
          disabled={disabled || isSaving}
          style={{ flex: '1 1 150px', minWidth: 0, padding: '8px 12px', background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
        >
          <option value="">بدون برند</option>
          {safeBrands.map(brand => (
            <option key={brand.id} value={brand.id}>
              {brand.name}{brand.faName ? ` — ${brand.faName}` : ''}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={disabled || isSaving}
          onClick={() => {
            setIsCreating(current => !current);
            setFeedback('');
          }}
          style={{ padding: '8px 10px', border: '1px solid rgba(248,120,32,0.28)', borderRadius: '8px', background: 'rgba(248,120,32,0.08)', color: '#f87820', fontSize: '11px', fontWeight: '700', cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
        >
          + افزودن برند جدید
        </button>
      </div>
      {isCreating && (
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
