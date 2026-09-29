'use client';

import { useRef, useState } from 'react';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from '@/components/admin/AdminIcons';
import { MAX_LAPTOP_IMAGES } from '@/lib/laptopImageOwnership';
import { LAPTOP_IMAGE_MAX_BYTES, LAPTOP_IMAGE_TYPES } from '@/lib/laptopImageValidation';

export function createLaptopImageState(urls = []) {
  return (Array.isArray(urls) ? urls : [])
    .filter(url => typeof url === 'string' && url.trim())
    .slice(0, MAX_LAPTOP_IMAGES)
    .map(url => ({ url, blobPathname: null, isNew: false }));
}

async function readApiResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'عملیات تصویر با خطا مواجه شد.');
  return payload;
}

export async function deleteLaptopUpload(blobPathname) {
  const response = await fetch('/api/admin/laptops/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blobPathname }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'پاک‌سازی تصویر آپلودشده ناموفق بود.');
  }
}

export async function cleanupUnsavedLaptopImages(images) {
  const candidates = (Array.isArray(images) ? images : [])
    .filter(image => image?.isNew && image.blobPathname);
  const results = await Promise.allSettled(candidates.map(image => deleteLaptopUpload(image.blobPathname)));
  return results.reduce((summary, result, index) => {
    const pathname = candidates[index].blobPathname;
    if (result.status === 'fulfilled') summary.cleaned.push(pathname);
    else summary.failed.push({ pathname, error: result.reason?.message || 'پاک‌سازی تصویر ناموفق بود.' });
    return summary;
  }, { cleaned: [], failed: [] });
}

function basicFileError(file) {
  if (!file?.size) return 'فایل خالی است.';
  if (!LAPTOP_IMAGE_TYPES.includes(file.type)) return 'فرمت فایل باید JPG، PNG یا WEBP باشد.';
  if (file.size > LAPTOP_IMAGE_MAX_BYTES) return 'حجم فایل بیشتر از ۱۰ مگابایت است.';
  return null;
}

export default function LaptopImageUploader({
  value,
  onChange,
  disabled = false,
  onUploadingChange,
}) {
  const images = Array.isArray(value) ? value : [];
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState('');
  const [feedback, setFeedback] = useState(null);

  const setUploadState = next => {
    setUploading(next);
    onUploadingChange?.(next);
  };

  const uploadFiles = async fileList => {
    const selected = [...(fileList || [])];
    if (!selected.length) {
      setFeedback({ type: 'error', message: 'هیچ فایلی برای آپلود انتخاب نشده است.' });
      return;
    }
    if (disabled || uploading) return;

    const remaining = Math.max(0, MAX_LAPTOP_IMAGES - images.length);
    const candidates = selected.slice(0, remaining);
    const failures = selected.slice(remaining).map(file => `${file.name}: ظرفیت ۱۲ تصویر تکمیل است.`);
    let successes = 0;
    setUploadState(true);
    setFeedback({ type: 'progress', message: 'در حال آپلود تصاویر…' });

    try {
      for (const file of candidates) {
        const localError = basicFileError(file);
        if (localError) {
          failures.push(`${file.name}: ${localError}`);
          continue;
        }
        try {
          const formData = new FormData();
          formData.set('file', file);
          const uploaded = await readApiResponse(await fetch('/api/admin/laptops/upload', {
            method: 'POST',
            body: formData,
          }));
          onChange(current => [...current, {
            url: uploaded.url,
            blobPathname: uploaded.blobPathname,
            isNew: true,
          }]);
          successes += 1;
        } catch (error) {
          failures.push(`${file.name}: ${error.message || 'آپلود ناموفق بود.'}`);
        }
      }
    } finally {
      setUploadState(false);
    }

    if (failures.length) {
      setFeedback({
        type: 'error',
        message: `${successes ? `${successes} تصویر آپلود شد. ` : ''}${failures.join(' | ')}`,
      });
    } else {
      setFeedback({ type: 'success', message: `${successes} تصویر با موفقیت آپلود شد.` });
    }
  };

  const handleInput = event => {
    const files = [...(event.target.files || [])];
    event.target.value = '';
    void uploadFiles(files);
  };

  const removeImage = async (image, index) => {
    if (disabled || uploading || pendingDelete) return;
    if (image.isNew && image.blobPathname) {
      setPendingDelete(image.blobPathname);
      try {
        await deleteLaptopUpload(image.blobPathname);
      } catch (error) {
        setFeedback({ type: 'error', message: error.message || 'پاک‌سازی تصویر ناموفق بود.' });
        setPendingDelete('');
        return;
      }
      setPendingDelete('');
    }
    onChange(current => current.filter((_, candidateIndex) => candidateIndex !== index));
    setFeedback({ type: 'success', message: 'تصویر از گالری حذف شد.' });
  };

  const makePrimary = index => {
    if (index === 0 || disabled) return;
    onChange(current => {
      const next = [...current];
      const [selected] = next.splice(index, 1);
      next.unshift(selected);
      return next;
    });
  };

  const move = (index, offset) => {
    const target = index + offset;
    if (target < 0 || target >= images.length || disabled) return;
    onChange(current => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const blocked = disabled || uploading || Boolean(pendingDelete);

  return (
    <div className={styles.laptopUploader}>
      <div className={styles.laptopUploaderHeader}>
        <span>تصویر اول، تصویر اصلی لپ‌تاپ است.</span>
        <output aria-label="تعداد تصاویر لپ‌تاپ">{images.length} / {MAX_LAPTOP_IMAGES}</output>
      </div>
      <div className={styles.uploaderBoxGrid}>
        <label
          className={`${styles.dragDropArea} ${dragActive ? styles.dragDropAreaActive : ''} ${blocked ? styles.dragDropAreaDisabled : ''}`}
          onDragEnter={event => { event.preventDefault(); if (!blocked) setDragActive(true); }}
          onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = blocked ? 'none' : 'copy'; }}
          onDragLeave={event => {
            event.preventDefault();
            if (!event.currentTarget.contains(event.relatedTarget)) setDragActive(false);
          }}
          onDrop={event => {
            event.preventDefault();
            setDragActive(false);
            if (!blocked) void uploadFiles(event.dataTransfer.files);
          }}
        >
          <input
            ref={fileInputRef}
            className={styles.visuallyHiddenFileInput}
            type="file"
            multiple
            accept={LAPTOP_IMAGE_TYPES.join(',')}
            onChange={handleInput}
            disabled={blocked || images.length >= MAX_LAPTOP_IMAGES}
          />
          <span className={styles.uploadIcon}>{AdminIcons.cloud(16)}</span>
          <p>
            {uploading ? 'در حال آپلود…' : 'برای انتخاب تصویر کلیک کنید'}<br />
            <span>یا فایل‌ها را اینجا بکشید و رها کنید<br />JPG، PNG یا WebP · حداکثر ۱۰MB</span>
          </p>
        </label>

        {images.map((image, index) => (
          <article
            key={image.blobPathname || image.url || index}
            className={`${styles.imageThumbCard} ${index === 0 ? styles.imageThumbCardPrimary : ''}`}
          >
            {/* Blob URLs are dynamic user content and intentionally bypass Next image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={`تصویر ${index + 1} لپ‌تاپ`} />
            <span className={styles.laptopImagePosition}>{String(index + 1).padStart(2, '0')}</span>
            <button
              type="button"
              onClick={() => removeImage(image, index)}
              className={styles.removeThumbBtn}
              disabled={blocked}
              aria-label={`حذف تصویر ${index + 1}`}
            >
              {AdminIcons.close(10)}
            </button>
            <button
              type="button"
              onClick={() => makePrimary(index)}
              className={styles.primaryThumbBtn}
              disabled={blocked || index === 0}
              aria-pressed={index === 0}
            >
              {index === 0 ? 'اصلی' : 'اصلی کن'}
            </button>
            <div className={styles.thumbOrderActions}>
              <button type="button" onClick={() => move(index, -1)} disabled={blocked || index === 0} aria-label={`انتقال تصویر ${index + 1} به قبل`}>→</button>
              <button type="button" onClick={() => move(index, 1)} disabled={blocked || index === images.length - 1} aria-label={`انتقال تصویر ${index + 1} به بعد`}>←</button>
            </div>
          </article>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={styles.addImageCard}
          disabled={blocked || images.length >= MAX_LAPTOP_IMAGES}
        >
          <span>+</span>
          <span>افزودن تصویر</span>
        </button>
      </div>

      {feedback && (
        <p
          className={`${styles.laptopUploadFeedback} ${styles[`laptopUploadFeedback_${feedback.type}`]}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
