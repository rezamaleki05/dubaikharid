'use client';

import {
  getPublicOptionState,
  selectedPublicVariantSummary,
  updatePublicVariantSelection,
} from '@/lib/publicProductVariantSelection';
import styles from './PublicProductVariantSelector.module.css';

export default function PublicProductVariantSelector({ product, selection, onChange, resolutionStatus }) {
  const axes = product?.variantAxes || [];
  if (!product?.requiresVariantSelection || axes.length === 0) return null;
  const summary = selectedPublicVariantSummary(axes, selection);

  const choose = (axisCode, optionCode) => {
    onChange(updatePublicVariantSelection({
      axes,
      variants: product.variants,
      selection,
      axisCode,
      optionCode,
    }));
  };

  return (
    <section className={styles.selectorPanel} aria-labelledby="variant-selector-title">
      <div className={styles.panelHeader}>
        <div>
          <h2 id="variant-selector-title" className={styles.panelTitle}>انتخاب مشخصات کالا</h2>
          <p className={styles.panelHint}>برای مشاهده قیمت و موجودی دقیق، گزینه‌های موردنظر را انتخاب کنید.</p>
        </div>
        <span className={styles.progress}>{summary.length} از {axes.length}</span>
      </div>

      <div className={styles.axes}>
        {axes.map(axis => (
          <fieldset className={styles.axis} key={axis.code}>
            <legend className={styles.axisLegend}>
              <span>{axis.nameFa}</span>
              {axis.nameEn ? <span className={styles.axisEnglish} lang="en" dir="ltr">{axis.nameEn}</span> : null}
            </legend>
            <div className={styles.options}>
              {axis.options.map(option => {
                const state = getPublicOptionState({
                  variants: product.variants,
                  selection,
                  axisCode: axis.code,
                  optionCode: option.code,
                  supplyMode: product.supplyMode,
                });
                const selected = selection?.[axis.code] === option.code;
                const isColor = axis.inputType === 'COLOR';
                const unavailable = !state.available;
                return (
                  <button
                    type="button"
                    key={option.code}
                    className={`${styles.option} ${isColor ? styles.colorOption : ''} ${selected ? styles.selected : ''} ${unavailable ? styles.unavailable : ''}`}
                    aria-pressed={selected}
                    aria-label={`${axis.nameFa}: ${option.labelFa}${unavailable ? '، ناموجود' : ''}`}
                    disabled={state.disabled}
                    onClick={() => choose(axis.code, option.code)}
                  >
                    {isColor ? (
                      <span
                        className={styles.swatch}
                        aria-hidden="true"
                        style={{ backgroundColor: option.swatchHex || '#8b92a5' }}
                      />
                    ) : null}
                    <span>{option.labelFa}</span>
                    {unavailable ? <span className={styles.optionStatus}>ناموجود</span> : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {summary.length > 0 ? (
        <div className={styles.summary} aria-live="polite">
          {summary.map(item => (
            <span key={item.attributeCode}>{item.attributeNameFa}: <strong>{item.labelFa}</strong></span>
          ))}
        </div>
      ) : null}

      {resolutionStatus === 'integrity_error' ? (
        <p className={styles.error} role="alert">اطلاعات تنوع این محصول نیاز به بررسی دارد. لطفاً با پشتیبانی تماس بگیرید.</p>
      ) : resolutionStatus === 'unavailable' ? (
        <p className={styles.error} role="status">این ترکیب در حال حاضر قابل سفارش نیست.</p>
      ) : null}
    </section>
  );
}
