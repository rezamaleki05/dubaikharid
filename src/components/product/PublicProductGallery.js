'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './PublicProductGallery.module.css';

function galleryItems(images, legacyImage, coverImage) {
  if (Array.isArray(images) && images.length) return images;
  const fallback = legacyImage || coverImage;
  return fallback ? [{ id: 'legacy-product-image', url: fallback, isPrimary: true, altFa: null, altEn: null }] : [];
}

export default function PublicProductGallery({ images, legacyImage, coverImage, productName, productNameEn }) {
  const items = useMemo(
    () => galleryItems(images, legacyImage, coverImage),
    [coverImage, images, legacyImage],
  );
  const initial = items.find(image => image.isPrimary) || items[0] || null;
  const [selectedId, setSelectedId] = useState(initial?.id || null);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  const move = offset => {
    const index = items.findIndex(image => image.id === (selectedId || initial?.id));
    setSelectedId(items[(index + offset + items.length) % items.length]?.id || null);
  };

  const selected = items.find(image => image.id === selectedId) || initial;
  if (!selected) return null;
  const selectedAlt = selected.altFa || selected.altEn || productName || productNameEn || 'تصویر محصول';

  return (
    <div className={styles.gallery}>
      <button type="button" ref={openerRef} className={styles.mainStage} aria-label="بزرگ‌نمایی تصویر محصول" onClick={() => dialogRef.current?.showModal()}>
        {/* Product URLs can come from multiple approved external stores, so a broad next/image allowlist is avoided. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={selected.url} alt={selectedAlt} className={styles.mainImage} />
        <span className={styles.zoomHint}>بزرگ‌نمایی ↗</span>
      </button>
      <dialog ref={dialogRef} className={styles.lightbox} aria-label="گالری بزرگ تصاویر محصول"
        onClose={() => openerRef.current?.focus()}
        onClick={event => { if (event.target === event.currentTarget) dialogRef.current.close(); }}
        onKeyDown={event => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
          }
        }}>
        <div className={styles.lightboxContent}>
          <button type="button" className={styles.close} autoFocus onClick={() => dialogRef.current.close()} aria-label="بستن گالری">×</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.url} alt={selectedAlt} />
          <div className={styles.lightboxNav}>
            <button type="button" disabled={items.length < 2} onClick={() => move(-1)} aria-label="تصویر قبلی">→</button>
            <output dir="ltr" aria-live="polite">{items.findIndex(image => image.id === selected.id) + 1} / {items.length}</output>
            <button type="button" disabled={items.length < 2} onClick={() => move(1)} aria-label="تصویر بعدی">←</button>
          </div>
        </div>
      </dialog>
      {items.length > 1 && (
        <div className={styles.thumbnails} role="group" aria-label="تصاویر محصول">
          {items.map((image, index) => {
            const active = image.id === selected.id;
            const alt = image.altFa || image.altEn || `${productName || 'محصول'} — تصویر ${index + 1}`;
            return (
              <button
                key={image.id}
                type="button"
                className={active ? styles.thumbnailActive : styles.thumbnail}
                onClick={() => setSelectedId(image.id)}
                aria-label={`نمایش تصویر ${index + 1} از ${items.length}`}
                aria-pressed={active}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={alt} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
