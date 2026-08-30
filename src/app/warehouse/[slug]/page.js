'use client';

import { use, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import styles from '../Warehouse.module.css';

const toman = value => Math.round(Number(value) || 0).toLocaleString('fa-IR');

export default function WarehouseDetailPage({ params }) {
  const { slug } = use(params);
  const { addToCart } = useCart();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/warehouse/${encodeURIComponent(slug)}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'کالا پیدا نشد.');
        setItem(payload);
      })
      .catch(fetchError => { if (fetchError.name !== 'AbortError') setError(fetchError.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug]);

  return <div className={styles.page}><Header /><main className={styles.main}>
    {loading && <div className={styles.empty}>در حال دریافت کالا...</div>}
    {!loading && error && <div className={styles.empty}>{error}</div>}
    {item && <div className={styles.detail}>
      <img className={styles.detailImage} src={item.image} alt={item.name} />
      <section className={styles.detailBody}><div className={styles.brand}>{item.brand || 'دبی خرید'}</div><h1 className={styles.title}>{item.name}</h1>{item.nameEn && <div className={styles.english}>{item.nameEn}</div>}<p className={styles.description}>{item.description}</p><div className={styles.priceRow}><strong className={styles.price}>{toman(item.finalPriceToman)} تومان</strong><span className={styles.stock}>{item.inStock ? `${item.available} عدد موجود` : 'ناموجود'}</span></div><button className={styles.cart} disabled={!item.inStock} onClick={() => addToCart(item)}>{item.inStock ? 'افزودن به سبد خرید' : 'ناموجود'}</button></section>
    </div>}
  </main><Footer /></div>;
}
