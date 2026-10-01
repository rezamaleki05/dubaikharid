'use client';

import { useRef, useState } from 'react';
import styles from './BrandFields.module.css';

export default function BrandLogoField({ value, fallback, onChange, onUploaded }) {
  const picker = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const upload = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true); setError('');
    try {
      const data = new FormData(); data.set('file', file);
      const response = await fetch('/api/admin/brands/upload', { method: 'POST', body: data });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'آپلود لوگو ناموفق بود.');
      onChange(payload.url); onUploaded(payload.blobPathname);
    } catch (uploadError) { setError(uploadError.message); }
    finally { setUploading(false); }
  };
  return (
    <div className={styles.logoField}>
      <span className={styles.label}>لوگوی برند</span>
      <div className={styles.logoPreview}>{value ? <img src={value} alt="پیش‌نمایش لوگو" onError={event => { event.currentTarget.hidden = true; }} /> : <strong>{fallback || 'برند'}</strong>}</div>
      <p>پس‌زمینه شفاف دقیقاً همان‌طور که در سایت دیده می‌شود نمایش داده شده است.</p>
      <div className={styles.logoActions}>
        <button type="button" onClick={() => picker.current?.click()} disabled={uploading}>{uploading ? 'در حال آپلود…' : value ? 'جایگزینی' : 'آپلود'}</button>
        {value ? <button type="button" className={styles.remove} onClick={() => onChange('')}>حذف</button> : null}
      </div>
      <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload} />
      {error ? <small className={styles.error}>{error}</small> : null}
    </div>
  );
}
