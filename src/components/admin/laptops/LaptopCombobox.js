'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styles from './LaptopCombobox.module.css';

export default function LaptopCombobox({ label, value, options, onChange, onCreate, createLabel, placeholder, required = false, disabled = false }) {
  const id = useId();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [query, setQuery] = useState(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const choices = [...new Set(options)].filter(option => option.toLowerCase().includes((query || '').trim().toLowerCase()));
  const choose = option => { onChange(option); setQuery(null); setOpen(false); setError(''); };
  const create = async () => {
    if (!query?.trim() || busy) return;
    setBusy(true); setError('');
    try { const created = await onCreate(query.trim()); if (mounted.current) choose(created || query.trim()); }
    catch (failure) { setError(failure.message || 'ثبت مقدار ناموفق بود.'); }
    finally { setBusy(false); }
  };
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <div className={styles.control}>
        <input id={id} role="combobox" aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list"
          aria-activedescendant={open && choices[active] ? `${id}-${active}` : undefined}
          required={required} disabled={disabled || busy} autoComplete="off" dir="auto"
          placeholder={placeholder || 'جستجو یا انتخاب...'} value={query ?? value}
          onFocus={() => { setOpen(true); setActive(0); }}
          onBlur={event => { if (!event.currentTarget.parentElement.parentElement.contains(event.relatedTarget)) { setOpen(false); setQuery(null); } }}
          onChange={event => { setQuery(event.target.value); onChange(''); setOpen(true); setActive(0); setError(''); }}
          onKeyDown={event => {
            if (event.key === 'Escape') { setOpen(false); setQuery(null); }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault(); setOpen(true);
              setActive(current => Math.max(0, Math.min(choices.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))));
            }
            if (event.key === 'Enter' && open && choices[active]) { event.preventDefault(); choose(choices[active]); }
          }} />
        {value && !required && <button type="button" aria-label={`پاک کردن ${label}`} disabled={disabled || busy} onClick={() => choose('')}>×</button>}
      </div>
      {open && !disabled && (
        <div className={styles.dropdown}>
          <ul id={`${id}-list`} role="listbox" aria-label={label}>
            {choices.map((option, index) => (
              <li id={`${id}-${index}`} role="option" aria-selected={option === value} key={option}>
                <button type="button" tabIndex={-1} className={index === active ? styles.active : ''} onMouseDown={event => event.preventDefault()} onClick={() => choose(option)} dir="auto">{option}</button>
              </li>
            ))}
            {!choices.length && <li role="presentation" className={styles.empty}>موردی پیدا نشد</li>}
          </ul>
          {onCreate && <button type="button" className={styles.create} disabled={!query?.trim() || busy} onMouseDown={event => event.preventDefault()} onClick={create}>{busy ? 'در حال ثبت…' : createLabel}{query?.trim() ? `: ${query.trim()}` : ''}</button>}
        </div>
      )}
      {error && <small role="alert" className={styles.error}>{error}</small>}
    </div>
  );
}
