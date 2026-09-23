import Link from 'next/link';
import styles from '@/app/stock-laptops/StockLaptops.module.css';

const fmtToman = value => Number(value).toLocaleString('fa-IR');

export default function StockLaptopCatalog({ groups }) {
  return (
    <section aria-label="مدل‌های موجود لپ تاپ استوک">
      <div className={styles.grid}>
        {groups.map(group => (
          <Link key={group.identity} href={`/laptops/${group.slug}`} className={styles.productCard}>
            <div className={styles.imageWrap}>
              <img src={group.image} alt={`لپ تاپ استوک ${group.brand} ${group.model}`} className={styles.productImg} />
              <span className={styles.storeBadge}>انبار ایران</span>
            </div>
            <div className={styles.cardBody}>
              <span className={styles.brandName}>{group.brand}</span>
              <h2 className={styles.productName}>{group.name}</h2>
              <p className={styles.productSpec}>
                {group.availableCount.toLocaleString('fa-IR')} دستگاه موجود با امکان مقایسه مشخصات
              </p>
              <div className={styles.priceRow}>
                <span className={styles.priceToman}>
                  {group.priceVaries ? 'از ' : ''}{fmtToman(group.lowPriceToman)} تومان
                </span>
              </div>
              <span className={styles.cartBtn}>مشاهده مشخصات و انتخاب دستگاه</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
