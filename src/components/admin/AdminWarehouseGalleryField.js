'use client';

import { useState } from 'react';
import { PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES } from '@/lib/productImageValidation';

const MAX_IMAGES = 12;

function normalizePrimary(images) {
  if (!images.length) return [];
  const primaryIndex = images.findIndex(image => image.isPrimary);
  const selectedIndex = primaryIndex >= 0 ? primaryIndex : 0;
  return images.map((image, index) => ({ ...image, isPrimary: index === selectedIndex }));
}

function validRemoteImageUrl(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export default function AdminWarehouseGalleryField({ value, onChange, disabled = false }) {
  const images = Array.isArray(value) ? value : [];
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const appendUrls = urls => {
    const existing = new Set(images.map(image => image.url));
    const additions = urls.filter(candidate => !existing.has(candidate)).map(candidate => ({
      url: candidate,
      isPrimary: images.length === 0,
    }));
    onChange(normalizePrimary([...images, ...additions].slice(0, MAX_IMAGES)));
  };

  const handleFiles = async event => {
    const files = [...(event.target.files || [])];
    event.target.value = '';
    if (!files.length || disabled) return;
    if (images.length + files.length > MAX_IMAGES) {
      setError(`حداکثر ${MAX_IMAGES} تصویر قابل ثبت است.`);
      return;
    }
    for (const file of files) {
      if (!PRODUCT_IMAGE_TYPES.includes(file.type) || !file.size || file.size > PRODUCT_IMAGE_MAX_BYTES) {
        setError('هر تصویر باید JPG، PNG یا WEBP و حداکثر ۴ مگابایت باشد.');
        return;
      }
    }
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of files) {
        const formData = new FormData();
        formData.set('file', file);
        const response = await fetch('/api/admin/warehouse/upload', { method: 'POST', body: formData });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'آپلود تصویر با خطا مواجه شد.');
        uploaded.push(payload.url);
      }
      appendUrls(uploaded);
    } catch (uploadError) {
      setError(uploadError.message || 'آپلود تصویر با خطا مواجه شد.');
    } finally {
      setUploading(false);
    }
  };

  const addUrl = () => {
    const cleanUrl = url.trim();
    if (!validRemoteImageUrl(cleanUrl)) {
      setError('آدرس اینترنتی تصویر معتبر نیست.');
      return;
    }
    if (images.length >= MAX_IMAGES) {
      setError(`حداکثر ${MAX_IMAGES} تصویر قابل ثبت است.`);
      return;
    }
    appendUrls([cleanUrl]);
    setUrl('');
    setError('');
  };

  const move = (index, offset) => {
    const target = index + offset;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = index => onChange(normalizePrimary(images.filter((_, candidateIndex) => candidateIndex !== index)));
  const makePrimary = index => onChange(images.map((image, candidateIndex) => ({ ...image, isPrimary: candidateIndex === index })));

  return <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <label style={{ color: '#8b92a5', fontSize: '11px' }}>گالری تصاویر محصول</label>
      <span style={{ color: '#697083', fontSize: '10px' }}>{images.length} / {MAX_IMAGES}</span>
    </div>
    <label style={{ padding: '12px', border: '1px dashed rgba(248,120,32,.35)', borderRadius: '9px', background: 'rgba(248,120,32,.04)', color: '#c0c8d8', textAlign: 'center', cursor: uploading || disabled ? 'wait' : 'pointer' }}>
      <input type="file" multiple accept={PRODUCT_IMAGE_TYPES.join(',')} onChange={handleFiles} disabled={uploading || disabled} style={{ display: 'none' }} />
      {uploading ? 'در حال آپلود تصاویر…' : 'انتخاب یک یا چند تصویر از دستگاه'}
    </label>
    <div style={{ display: 'flex', gap: '8px' }}>
      <input type="url" dir="ltr" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://example.com/image.jpg" disabled={uploading || disabled} style={{ minWidth: 0, flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
      <button type="button" onClick={addUrl} disabled={uploading || disabled} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(248,120,32,.3)', background: 'rgba(248,120,32,.08)', color: '#f87820', fontWeight: 800, cursor: 'pointer' }}>افزودن لینک</button>
    </div>
    {images.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '9px' }}>
      {images.map((image, index) => <div key={`${image.id || image.url}-${index}`} style={{ position: 'relative', padding: '5px', borderRadius: '10px', border: image.isPrimary ? '1px solid #f87820' : '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.025)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt={`تصویر ${index + 1}`} style={{ display: 'block', width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '7px' }} />
        <button type="button" onClick={() => makePrimary(index)} disabled={image.isPrimary || disabled} style={{ width: '100%', marginTop: '5px', padding: '5px 3px', border: 0, borderRadius: '6px', background: image.isPrimary ? '#f87820' : 'rgba(255,255,255,.06)', color: '#fff', fontSize: '9px', cursor: 'pointer' }}>{image.isPrimary ? 'تصویر اصلی' : 'انتخاب به‌عنوان اصلی'}</button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginTop: '4px' }}>
          <button type="button" aria-label="انتقال به قبل" onClick={() => move(index, -1)} disabled={index === 0 || disabled} style={{ border: 0, borderRadius: '5px', background: 'rgba(255,255,255,.05)', color: '#c0c8d8' }}>→</button>
          <button type="button" aria-label="انتقال به بعد" onClick={() => move(index, 1)} disabled={index === images.length - 1 || disabled} style={{ border: 0, borderRadius: '5px', background: 'rgba(255,255,255,.05)', color: '#c0c8d8' }}>←</button>
          <button type="button" aria-label="حذف تصویر" onClick={() => remove(index)} disabled={disabled} style={{ border: 0, borderRadius: '5px', background: 'rgba(239,68,68,.1)', color: '#ef4444' }}>×</button>
        </div>
      </div>)}
    </div>}
    {error && <p role="alert" style={{ margin: 0, color: '#ef4444', fontSize: '10.5px' }}>{error}</p>}
  </div>;
}
