'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './Warehouse.module.css';

const toman = value => Math.round(Number(value) || 0).toLocaleString('fa-IR');

export default function PublicWarehousePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/warehouse?limit=60', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'دریافت موجودی انجام نشد.');
        setItems(payload.data || []);
      })
      .catch(fetchError => { if (fetchError.name !== 'AbortError') setError(fetchError.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return <div className={styles.page}><Header /><main className={styles.main}>
    <div className={styles.header}><div><h1 className={styles.title}>موجودی آماده ارسال</h1><p className={styles.subtitle}>کالاهای موجود و متعلق به دبی خرید، با قیمت قطعی تومانی و ارسال مستقیم.</p></div></div>
    {loading && <div className={styles.empty}>در حال دریافت موجودی...</div>}
    {!loading && error && <div className={styles.empty}>{error}</div>}
    {!loading && !error && items.length === 0 && <div className={styles.empty}>در حال حاضر کالای منتشرشده‌ای در انبار موجود نیست.</div>}
    <div className={styles.grid}>{items.map(item => <Link key={item.id} className={styles.card} href={`/warehouse/${item.slug || item.id}`}>
      <div className={styles.imageWrap}><img className={styles.image} src={item.image} alt={item.name} /><span className={styles.badge}>{item.inStock ? 'موجود در انبار' : 'ناموجود'}</span></div>
      <div className={styles.body}><div className={styles.brand}>{item.brand}</div><h2 className={styles.name}>{item.name}</h2>{item.nameEn && <div className={styles.english}>{item.nameEn}</div>}<div className={styles.priceRow}><span className={styles.price}>{toman(item.finalPriceToman)} تومان</span><span className={styles.stock}>{item.inStock ? `${item.available} عدد آماده` : 'ناموجود'}</span></div></div>
    </Link>)}</div>
  </main><Footer /></div>;
}
