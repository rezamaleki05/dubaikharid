'use client';

import { PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES } from '@/lib/productImageValidation';

export function createProductImageState(existingUrl = '', method = 'upload') {
  return {
    method,
    existingUrl,
    url: existingUrl,
    file: null,
    filename: '',
    preview: existingUrl,
    removed: false,
    error: '',
  };
}

function safePreviewUrl(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password
      ? parsed.toString()
      : '';
  } catch {
    return '';
  }
}

export default function AdminProductImageField({ value, onChange, uploading = false }) {
  const setMethod = method => {
    onChange({
      ...value,
      method,
      file: null,
      filename: '',
      preview: method === 'url' ? value.url : (value.removed ? '' : value.existingUrl),
      error: '',
    });
  };

  const handleFile = event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!PRODUCT_IMAGE_TYPES.includes(file.type)) {
      onChange({ ...value, file: null, filename: '', preview: value.existingUrl, error: 'فرمت تصویر باید JPG، PNG یا WEBP باشد.' });
      return;
    }
    if (!file.size || file.size > PRODUCT_IMAGE_MAX_BYTES) {
      onChange({ ...value, file: null, filename: '', preview: value.existingUrl, error: 'حجم تصویر نباید بیشتر از ۴ مگابایت باشد.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange({
      ...value,
      method: 'upload',
      file,
      filename: file.name,
      preview: typeof reader.result === 'string' ? reader.result : '',
      removed: false,
      error: '',
    });
    reader.onerror = () => onChange({ ...value, file: null, filename: '', error: 'نمایش پیش‌نمایش تصویر امکان‌پذیر نیست.' });
    reader.readAsDataURL(file);
  };

  const removeImage = () => onChange({
    ...value,
    file: null,
    filename: '',
    url: '',
    preview: '',
    removed: true,
    error: '',
  });

  const preview = value.method === 'url' ? safePreviewUrl(value.url.trim()) : value.preview;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '11px', color: '#8b92a5' }}>تصویر محصول:</label>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button type="button" onClick={() => setMethod('upload')} disabled={uploading} style={{ flex: 1, padding: '7px 10px', borderRadius: '7px', border: value.method === 'upload' ? '1px solid #f87820' : '1px solid rgba(255,255,255,0.08)', background: value.method === 'upload' ? 'rgba(248,120,32,0.1)' : 'rgba(255,255,255,0.03)', color: value.method === 'upload' ? '#f87820' : '#c0c8d8', fontSize: '11px', cursor: 'pointer' }}>آپلود تصویر</button>
        <button type="button" onClick={() => setMethod('url')} disabled={uploading} style={{ flex: 1, padding: '7px 10px', borderRadius: '7px', border: value.method === 'url' ? '1px solid #f87820' : '1px solid rgba(255,255,255,0.08)', background: value.method === 'url' ? 'rgba(248,120,32,0.1)' : 'rgba(255,255,255,0.03)', color: value.method === 'url' ? '#f87820' : '#c0c8d8', fontSize: '11px', cursor: 'pointer' }}>لینک تصویر</button>
      </div>
      {value.method === 'upload' ? (
        <label style={{ padding: '12px', border: '1px dashed rgba(248,120,32,0.35)', borderRadius: '8px', background: 'rgba(248,120,32,0.04)', color: '#c0c8d8', fontSize: '11px', cursor: uploading ? 'wait' : 'pointer', textAlign: 'center' }}>
          <input type="file" accept={PRODUCT_IMAGE_TYPES.join(',')} onChange={handleFile} disabled={uploading} style={{ display: 'none' }} />
          {uploading ? 'در حال آپلود تصویر…' : value.filename || 'انتخاب تصویر از دستگاه (JPG, PNG, WEBP — حداکثر ۴MB)'}
        </label>
      ) : (
        <input
          type="url"
          value={value.url}
          onChange={event => onChange({ ...value, url: event.target.value, preview: event.target.value, removed: !event.target.value, error: '' })}
          placeholder="https://example.com/product.jpg"
          disabled={uploading}
          style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
        />
      )}
      {preview && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* The preview can be an in-memory data URL before upload, so next/image cannot optimize it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="پیش‌نمایش تصویر محصول" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }} />
          <button type="button" onClick={removeImage} disabled={uploading} style={{ border: 0, background: 'transparent', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}>حذف تصویر</button>
        </div>
      )}
      {value.error && <p role="alert" style={{ margin: 0, color: '#ef4444', fontSize: '10.5px' }}>{value.error}</p>}
    </div>
  );
}
