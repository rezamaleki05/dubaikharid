'use client';

import { useEffect, useRef, useState } from 'react';
import {
  currentJalaliDate,
  formatJalaliDate,
  jalaliMonthLength,
  normalizeJalaliDate,
  parseJalaliDate,
  validateJalaliDate,
} from '@/lib/jalaliDate';
import styles from './JalaliDateField.module.css';

const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

export default function JalaliDateField({ value, onChange, error, onError }) {
  const rootRef = useRef(null);
  const initial = parseJalaliDate(value) || currentJalaliDate();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ year: initial.year, month: initial.month });

  useEffect(() => {
    const close = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const shiftMonth = amount => setView(current => {
    const index = current.year * 12 + current.month - 1 + amount;
    return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 + 1 };
  });

  const commitTyped = () => {
    const message = validateJalaliDate(value);
    onError(message);
    const normalized = normalizeJalaliDate(value);
    if (normalized && normalized !== value) onChange(normalized);
  };

  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.inputRow}>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={event => { onChange(event.target.value); onError(''); }}
          onFocus={() => setOpen(true)}
          onBlur={commitTyped}
          placeholder="مثال: 1405/03/20"
          aria-invalid={Boolean(error)}
          aria-describedby="laptop-arrival-date-help"
          className={styles.input}
        />
        <button type="button" className={styles.toggle} onClick={() => setOpen(current => !current)} aria-label="باز کردن تقویم شمسی">▦</button>
      </div>
      <small id="laptop-arrival-date-help" className={error ? styles.error : styles.help}>{error || 'فرمت شمسی: 1405/03/20'}</small>
      {open ? (
        <div className={styles.popover} role="dialog" aria-label="انتخاب تاریخ شمسی" onMouseDown={event => event.preventDefault()}>
          <div className={styles.header}>
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="ماه قبل">‹</button>
            <strong>{MONTHS[view.month - 1]} {view.year.toLocaleString('fa-IR', { useGrouping: false })}</strong>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="ماه بعد">›</button>
          </div>
          <div className={styles.days}>
            {Array.from({ length: jalaliMonthLength(view.year, view.month) }, (_, index) => index + 1).map(day => {
              const next = formatJalaliDate({ ...view, day });
              return <button key={day} type="button" className={value === next ? styles.selected : ''} onClick={() => { onChange(next); onError(''); setOpen(false); }}>{day.toLocaleString('fa-IR')}</button>;
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
