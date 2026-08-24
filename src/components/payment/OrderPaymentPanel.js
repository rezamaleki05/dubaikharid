'use client';

import { useEffect, useState } from 'react';
import ManualPaymentPanel from './ManualPaymentPanel';
import styles from './ManualPayment.module.css';

export default function OrderPaymentPanel({ orderCode }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/account/orders/${encodeURIComponent(orderCode)}/manual-payment`, { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'دریافت اطلاعات پرداخت انجام نشد.');
        setData(payload.data);
      })
      .catch(fetchError => { if (fetchError.name !== 'AbortError') setError(fetchError.message); });
    return () => controller.abort();
  }, [orderCode]);

  if (error) return <div className={styles.inlineError}>{error}</div>;
  if (!data) return <div className={styles.loadingBar} aria-label="در حال دریافت اطلاعات پرداخت" />;
  return <ManualPaymentPanel orderCode={data.orderCode} totalToman={data.totalToman} access={data} />;
}
