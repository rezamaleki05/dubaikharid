'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './BrandLogosBar.module.css';

function BrandMark({ item }) {
  if (item.hasImage && item.img) {
    return (
      <div className={styles.brandLogoWrap}>
        <img src={item.img} alt={item.name} style={{ filter: 'brightness(0) invert(1)', height: '24px', width: 'auto', maxWidth: '96px', objectFit: 'contain' }} />
      </div>
    );
  }
  return (
    <div className={styles.brandLogoWrap}>
      <span className={styles.brandName} style={{ fontFamily: 'Georgia,serif', letterSpacing: '2px', fontSize: '14px' }}>
        {item.fallback || item.name}
      </span>
    </div>
  );
}

export default function BrandLogosBar() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/catalog/discovery?limit=40', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'دریافت برندها با خطا مواجه شد.');
        const brands = Array.isArray(payload.brands)
          ? payload.brands.map(item => ({ ...item, href: `/brands/${item.id}` }))
          : [];
        const stores = Array.isArray(payload.stores)
          ? payload.stores.map(item => ({ ...item, href: `/stores/${item.id}` }))
          : [];
        setItems([...brands, ...stores]);
      })
      .catch(error => {
        if (error.name !== 'AbortError') console.error('Error fetching homepage brand discovery:', error);
      });
    return () => controller.abort();
  }, []);

  if (!items.length) return null;
  const repeatedItems = [...items, ...items, ...items, ...items];
  const renderItems = suffix => repeatedItems.map((item, index) => (
    <Link
      key={`${suffix}-${item.id}-${index}`}
      href={item.href}
      className={styles.brandCard}
      title={`راهنمای خرید از ${item.name}`}
      aria-label={`راهنمای خرید از ${item.name}`}
    >
      <BrandMark item={item} />
    </Link>
  ));

  return (
    <section className={styles.sectionWrapper}>
      <div className={styles.brandBar}>
        <div className={styles.marqueeTrack}>
          <div className={styles.marqueeInner}>{renderItems('first')}</div>
          <div className={styles.marqueeInner}>{renderItems('second')}</div>
        </div>
      </div>
    </section>
  );
}
