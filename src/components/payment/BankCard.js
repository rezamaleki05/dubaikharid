'use client';

import { useState } from 'react';
import MinimalIcon from '@/components/ui/MinimalIcon';
import styles from './ManualPayment.module.css';

export function cleanCopyValue(value) {
  return String(value || '').replace(/[\s-]/g, '');
}

export function formatCardNumber(value) {
  return cleanCopyValue(value).replace(/(.{4})/g, '$1 ').trim();
}

export default function BankCard({ account }) {
  const [copyMessage, setCopyMessage] = useState('');
  if (!account) return null;

  const copy = async (value, message) => {
    await navigator.clipboard.writeText(cleanCopyValue(value));
    setCopyMessage(message);
    window.setTimeout(() => setCopyMessage(''), 2200);
  };

  return (
    <section className={styles.bankSection} aria-label="اطلاعات حساب بانکی">
      <div className={styles.visualCard}>
        <div className={styles.cardTopline}>
          <span className={styles.bankName}>{account.bankName}</span>
          <span className={styles.cardMark}>DK</span>
        </div>
        <div className={styles.chip} aria-hidden="true"><i /><i /><i /></div>
        <div className={styles.cardNumber} dir="ltr">{formatCardNumber(account.cardNumber)}</div>
        <div className={styles.cardHolder}>
          <span>صاحب حساب</span>
          <strong>{account.accountHolderName}</strong>
        </div>
      </div>

      <dl className={styles.bankDetails}>
        <div><dt>نام بانک</dt><dd>{account.bankName}</dd></div>
        <div><dt>شماره کارت</dt><dd dir="ltr">{formatCardNumber(account.cardNumber)}</dd></div>
        <div><dt>شماره شبا</dt><dd dir="ltr">{account.iban}</dd></div>
        <div><dt>نام صاحب حساب</dt><dd>{account.accountHolderName}</dd></div>
      </dl>

      <div className={styles.copyActions}>
        <button type="button" onClick={() => copy(account.cardNumber, 'شماره کارت کپی شد')}><MinimalIcon name="clipboard" size={15} /> کپی شماره کارت</button>
        <button type="button" onClick={() => copy(account.iban, 'شماره شبا کپی شد')}><MinimalIcon name="clipboard" size={15} /> کپی شماره شبا</button>
      </div>
      <div className={styles.copyStatus} role="status" aria-live="polite">{copyMessage}</div>
    </section>
  );
}
