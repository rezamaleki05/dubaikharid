'use client';

import { useCart } from '@/context/CartContext';
import { laptopConditionLabel } from '@/lib/laptopSeoDomain';
import styles from '@/app/laptops/[slug]/LaptopModel.module.css';

const fmtToman = value => Number(value).toLocaleString('fa-IR');

export default function LaptopModelUnits({ units }) {
  const { addToCart } = useCart();
  return (
    <div className={styles.unitsGrid}>
      {units.map((unit, index) => {
        const specs = [
          unit.cpu,
          unit.ram ? `رم ${unit.ram}` : null,
          unit.storage ? `حافظه ${unit.storage}` : null,
          unit.secondaryStorage ? `حافظه دوم ${unit.secondaryStorage}` : null,
          unit.gpu,
          unit.screen ? `نمایشگر ${unit.screen}` : null,
          laptopConditionLabel(unit.condition) ? `وضعیت ${laptopConditionLabel(unit.condition)}` : null,
          unit.manufactureYear ? `سال ساخت ${unit.manufactureYear}` : null,
          unit.batteryHealth != null ? `سلامت باتری ${unit.batteryHealth}٪` : null,
        ].filter(Boolean);
        return (
          <article key={unit.id} className={styles.unitCard}>
            <img className={styles.unitImage} src={unit.image} alt={`${unit.brand} ${unit.model} - گزینه ${index + 1}`} />
            <div className={styles.unitBody}>
              <h3>{unit.brand} {unit.model} — گزینه {Number(index + 1).toLocaleString('fa-IR')}</h3>
              <ul className={styles.specList}>
                {specs.map(spec => <li key={spec}>{spec}</li>)}
              </ul>
              <div className={styles.unitFooter}>
                <span className={styles.unitPrice}>{fmtToman(unit.priceToman)} تومان</span>
                <button type="button" className={styles.buyButton} onClick={() => addToCart(unit)}>
                  افزودن این دستگاه به سبد خرید
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
