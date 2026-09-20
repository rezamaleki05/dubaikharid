'use client';

import { useState } from 'react';
import { PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES } from '@/lib/productImageValidation';
import { MAX_PRODUCT_IMAGES, normalizeProductImageUrl } from '@/lib/productGallery';
import styles from './AdminProductGalleryField.module.css';

function normalizePrimary(images) {
  if (!images.length) return [];
  const primaryIndex = images.findIndex(image => image.isPrimary);
  const selectedIndex = primaryIndex >= 0 ? primaryIndex : 0;
  return images.map((image, index) => ({ ...image, isPrimary: index === selectedIndex }));
}

export function createProductGalleryState(images = []) {
  return normalizePrimary((Array.isArray(images) ? images : []).map(image => ({
    id: image.id || null,
    url: image.url || '',
    blobPathname: image.blobPathname || null,
    isPrimary: image.isPrimary === true,
    altFa: image.altFa || '',
    altEn: image.altEn || '',
    file: null,
    preview: image.url || '',
  })));
}

function readPreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('نمایش پیش‌نمایش تصویر امکان‌پذیر نیست.'));
    reader.readAsDataURL(file);
  });
}

export default function AdminProductGalleryField({
  value,
  onChange,
  legacyImage = '',
  onLegacyImageChange,
  disabled = false,
}) {
  const images = Array.isArray(value) ? value : [];
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleFiles = async event => {
    const files = [...(event.target.files || [])];
    event.target.value = '';
    if (!files.length || disabled) return;
    if (images.length + files.length > MAX_PRODUCT_IMAGES) {
      setError(`حداکثر ${MAX_PRODUCT_IMAGES} تصویر قابل ثبت است.`);
      return;
    }
    if (files.some(file => (
      !PRODUCT_IMAGE_TYPES.includes(file.type) || !file.size || file.size > PRODUCT_IMAGE_MAX_BYTES
    ))) {
      setError('هر تصویر باید JPG، PNG یا WEBP و حداکثر ۴ مگابایت باشد.');
      return;
    }
    try {
      const additions = await Promise.all(files.map(async file => ({
        id: null,
        url: '',
        blobPathname: null,
        isPrimary: false,
        altFa: '',
        altEn: '',
        file,
        preview: await readPreview(file),
      })));
      onChange(normalizePrimary([...images, ...additions]));
      setError('');
    } catch (previewError) {
      setError(previewError.message || 'نمایش پیش‌نمایش تصویر امکان‌پذیر نیست.');
    }
  };

  const addUrl = () => {
    const cleanUrl = normalizeProductImageUrl(url);
    if (!cleanUrl) {
      setError('آدرس اینترنتی تصویر معتبر نیست.');
      return;
    }
    if (images.length >= MAX_PRODUCT_IMAGES) {
      setError(`حداکثر ${MAX_PRODUCT_IMAGES} تصویر قابل ثبت است.`);
      return;
    }
    if (images.some(image => image.url === cleanUrl)) {
      setError('این تصویر قبلاً به گالری اضافه شده است.');
      return;
    }
    onChange(normalizePrimary([...images, {
      id: null,
      url: cleanUrl,
      blobPathname: null,
      isPrimary: images.length === 0,
      altFa: '',
      altEn: '',
      file: null,
      preview: cleanUrl,
    }]));
    setUrl('');
    setError('');
  };

  const importLegacy = () => {
    if (!legacyImage || images.length >= MAX_PRODUCT_IMAGES) return;
    const existing = images.find(image => image.url === legacyImage);
    if (!existing) {
      onChange(normalizePrimary([...images, {
        id: null,
        url: legacyImage,
        blobPathname: null,
        isPrimary: images.length === 0,
        altFa: '',
        altEn: '',
        file: null,
        preview: legacyImage,
      }]));
    }
    onLegacyImageChange('');
  };

  const update = (index, patch) => onChange(images.map((image, candidateIndex) => (
    candidateIndex === index ? { ...image, ...patch } : image
  )));
  const move = (index, offset) => {
    const target = index + offset;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const remove = index => onChange(normalizePrimary(images.filter((_, candidateIndex) => candidateIndex !== index)));
  const makePrimary = index => onChange(images.map((image, candidateIndex) => ({
    ...image,
    isPrimary: candidateIndex === index,
  })));

  return (
    <div className={styles.gallery}>
      <div className={styles.galleryHeader}>
        <div><strong>گالری تصاویر محصول</strong><span>تصویر اصلی روی کارت‌ها نمایش داده می‌شود.</span></div>
        <output aria-label="تعداد تصاویر">{images.length} / {MAX_PRODUCT_IMAGES}</output>
      </div>

      <label className={styles.uploadZone}>
        <input type="file" multiple accept={PRODUCT_IMAGE_TYPES.join(',')} onChange={handleFiles} disabled={disabled} />
        <strong>انتخاب چند تصویر از دستگاه</strong>
        <span>JPG، PNG یا WEBP · هر فایل حداکثر ۴MB</span>
      </label>

      <div className={styles.urlRow}>
        <input type="url" dir="ltr" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://example.com/product.jpg" disabled={disabled} />
        <button type="button" onClick={addUrl} disabled={disabled}>افزودن لینک</button>
      </div>

      {legacyImage && (
        <aside className={styles.legacy}>
          {/* Arbitrary legacy external URLs cannot use next/image without broadening the remote allowlist. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={legacyImage} alt="تصویر قدیمی محصول" />
          <div><strong>تصویر قدیمی محصول</strong><span>تا زمانی که گالری خالی است، همین تصویر نمایش داده می‌شود.</span></div>
          <button type="button" onClick={importLegacy} disabled={disabled || images.length >= MAX_PRODUCT_IMAGES}>انتقال به گالری</button>
          <button type="button" className={styles.danger} onClick={() => onLegacyImageChange('')} disabled={disabled}>حذف قدیمی</button>
        </aside>
      )}

      {images.length > 0 && (
        <div className={styles.imageGrid}>
          {images.map((image, index) => (
            <article className={image.isPrimary ? styles.imagePrimary : styles.imageCard} key={image.id || image.preview || index}>
              <div className={styles.preview}>
                {/* Local data previews and arbitrary external URLs are intentionally rendered without optimization. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.preview || image.url} alt={image.altFa || `تصویر ${index + 1} محصول`} />
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <button type="button" className={styles.primaryButton} onClick={() => makePrimary(index)} disabled={image.isPrimary || disabled} aria-pressed={image.isPrimary}>
                {image.isPrimary ? 'تصویر اصلی' : 'انتخاب به‌عنوان اصلی'}
              </button>
              <div className={styles.altFields}>
                <label><span>متن جایگزین فارسی</span><input maxLength={240} value={image.altFa} onChange={event => update(index, { altFa: event.target.value })} disabled={disabled} /></label>
                <label><span>Alt English</span><input dir="ltr" maxLength={240} value={image.altEn} onChange={event => update(index, { altEn: event.target.value })} disabled={disabled} /></label>
              </div>
              <div className={styles.actions}>
                <button type="button" aria-label={`انتقال تصویر ${index + 1} به قبل`} onClick={() => move(index, -1)} disabled={index === 0 || disabled}>→</button>
                <button type="button" aria-label={`انتقال تصویر ${index + 1} به بعد`} onClick={() => move(index, 1)} disabled={index === images.length - 1 || disabled}>←</button>
                <button type="button" className={styles.danger} aria-label={`حذف تصویر ${index + 1}`} onClick={() => remove(index)} disabled={disabled}>حذف</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
