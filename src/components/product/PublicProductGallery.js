'use client';

import { useMemo, useState } from 'react';
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

  const selected = items.find(image => image.id === selectedId) || initial;
  if (!selected) return null;
  const selectedAlt = selected.altFa || selected.altEn || productName || productNameEn || 'تصویر محصول';

  return (
    <div className={styles.gallery}>
      <div className={styles.mainStage}>
        {/* Product URLs can come from multiple approved external stores, so a broad next/image allowlist is avoided. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={selected.url} alt={selectedAlt} className={styles.mainImage} />
      </div>
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
