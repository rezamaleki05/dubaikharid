'use client';

import { useEffect } from 'react';
import ui from './CatalogAttributeAdmin.module.css';

export function CatalogDialog({ title, description, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className={ui.dialogBackdrop} role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className={`${ui.dialog} ${wide ? ui.dialogWide : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-dialog-title"
      >
        <header className={ui.dialogHeader}>
          <div>
            <h2 id="catalog-dialog-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className={`${ui.iconButton} ${ui.closeButton}`} onClick={onClose} aria-label="بستن">×</button>
        </header>
        <div className={ui.dialogBody}>{children}</div>
        {footer && <footer className={ui.dialogFooter}>{footer}</footer>}
      </section>
    </div>
  );
}

export function ToggleRow({ checked, onChange, title, description, disabled = false, compact = false }) {
  return (
    <div className={`${ui.switchRow} ${compact ? ui.compactSwitch : ''}`}>
      <div className={ui.switchCopy}>
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
      <label className={ui.switch}>
        <input
          className={ui.switchInput}
          type="checkbox"
          checked={Boolean(checked)}
          onChange={event => onChange(event.target.checked)}
          disabled={disabled}
          aria-label={title}
        />
        <span className={ui.switchTrack} />
      </label>
    </div>
  );
}
