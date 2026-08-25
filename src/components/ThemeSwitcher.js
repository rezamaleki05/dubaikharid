'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import styles from './ThemeSwitcher.module.css';

const OPTIONS = [
  { value: 'light', label: 'روشن', icon: 'sun' },
  { value: 'dark', label: 'تیره', icon: 'moon' },
  { value: 'system', label: 'سیستم', icon: 'system' },
];

function ThemeIcon({ type }) {
  if (type === 'sun') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.6"/><path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56"/></svg>;
  }
  if (type === 'moon') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.2A8.4 8.4 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z"/></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
}

export default function ThemeSwitcher({ className = '', compact = false }) {
  const { preference, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = OPTIONS.find((option) => option.value === preference) || OPTIONS[2];

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.key === 'Escape' || (rootRef.current && !rootRef.current.contains(event.target))) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`${styles.root} ${compact ? styles.compact : ''} ${className}`}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={`پوسته: ${selected.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.resolvedIcon} aria-hidden="true">
          <span className={styles.lightIcon}><ThemeIcon type="sun" /></span>
          <span className={styles.darkIcon}><ThemeIcon type="moon" /></span>
        </span>
        {!compact && <span>{selected.label}</span>}
      </button>
      {open && (
        <div className={styles.menu} role="menu" aria-label="انتخاب پوسته">
          {OPTIONS.map((option) => (
            <button
              type="button"
              role="menuitemradio"
              aria-checked={preference === option.value}
              className={preference === option.value ? styles.active : ''}
              key={option.value}
              onClick={() => {
                setTheme(option.value);
                setOpen(false);
              }}
            >
              <ThemeIcon type={option.icon} />
              <span>{option.label}</span>
              <i aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
