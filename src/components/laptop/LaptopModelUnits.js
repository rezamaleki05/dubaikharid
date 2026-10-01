'use client';

import { useCart } from '@/context/CartContext';
import { laptopConditionLabel } from '@/lib/laptopSeoDomain';
import styles from '@/app/laptops/[slug]/LaptopModel.module.css';

const fmtToman = value => Number(value).toLocaleString('fa-IR');
const TEST_LABELS = { keyboard: 'کیبورد', speaker: 'اسپیکر', display: 'نمایشگر', usb: 'USB', battery: 'باتری', wifi: 'Wi-Fi', camera: 'دوربین', charge: 'شارژ' };

export default function LaptopModelUnits({ units }) {
  const { addToCart } = useCart();
  return (
    <div className={styles.unitsGrid}>
      {units.map((unit, index) => {
        const specs = [
          ['پردازنده', unit.cpu], ['رم', unit.ram], ['حافظه اصلی', unit.storage],
          ['حافظه دوم', unit.secondaryStorage], ['گرافیک', unit.gpu], ['نمایشگر', unit.screen],
          ['سال ساخت', unit.manufactureYear], ['رنگ', unit.color],
          ['وضعیت ظاهری', laptopConditionLabel(unit.condition)],
          ['سلامت باتری', unit.batteryHealth != null ? `${unit.batteryHealth}٪` : null],
          ['وزن', unit.weightKg ? `${unit.weightKg} کیلوگرم` : null],
        ].filter(([, value]) => value !== null && value !== undefined && value !== '');
        const passedTests = Object.entries(unit.hardwareTests || {}).filter(([, passed]) => passed).map(([key]) => TEST_LABELS[key]).filter(Boolean);
        return (
          <article key={unit.id} className={styles.unitCard}>
            <div className={styles.unitMedia}><span>موجود و آماده ارسال</span><img className={styles.unitImage} src={unit.image} alt={`${unit.brand} ${unit.model} - گزینه ${index + 1}`} /></div>
            <div className={styles.unitBody}>
              <div className={styles.unitTitle}><div><small>دستگاه {Number(index + 1).toLocaleString('fa-IR')}</small><h3>{unit.brand} {unit.model}</h3></div><span>{laptopConditionLabel(unit.condition)}</span></div>
              <dl className={styles.specList}>{specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              {passedTests.length ? <div className={styles.tests}><strong>تست‌شده:</strong> {passedTests.join('، ')}</div> : null}
              <div className={styles.unitFooter}>
                <div><small>قیمت قطعی</small><span className={styles.unitPrice}>{fmtToman(unit.priceToman)} تومان</span></div>
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
