'use client';

import { useMemo, useState } from 'react';
import styles from './BrandFields.module.css';

export default function BrandCategoryMultiSelect({ categories, value, onChange }) {
  const [query, setQuery] = useState('');
  const selected = new Set(value || []);
  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fa-IR');
    return categories.filter(category => !needle || `${category.name || ''} ${category.query || ''}`.toLocaleLowerCase('fa-IR').includes(needle));
  }, [categories, query]);
  const selectedCategories = categories.filter(category => selected.has(category.id));
  const toggle = id => onChange(selected.has(id) ? value.filter(item => item !== id) : [...value, id]);
  return (
    <div className={styles.categoryField}>
      <label htmlFor="brand-category-search">دسته‌بندی‌های مرتبط</label>
      {selectedCategories.length ? <div className={styles.chips}>{selectedCategories.map(category => <button type="button" key={category.id} onClick={() => toggle(category.id)}>{category.name}<span>×</span></button>)}</div> : null}
      <input id="brand-category-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="جستجوی فارسی یا English…" />
      <div className={styles.results} role="listbox" aria-multiselectable="true">
        {matches.map(category => <button type="button" role="option" aria-selected={selected.has(category.id)} key={category.id} onClick={() => toggle(category.id)}><span>{category.name}</span><small dir="ltr">{category.query || ''}</small><b>{selected.has(category.id) ? '✓' : '+'}</b></button>)}
        {!matches.length ? <p>موردی پیدا نشد.</p> : null}
      </div>
    </div>
  );
}
