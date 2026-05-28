'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './Search.module.css';

// Using the same mock data for demonstration
const mockDatabase = [
  { id: 'gucci', name: 'Gucci', faName: 'گوچی', cat: 'مد و پوشاک', hasImage: false, fallback: 'GUCCI' },
  { id: 'lv', name: 'Louis Vuitton', faName: 'لویی ویتون', cat: 'مد و پوشاک', hasImage: false, fallback: 'LV' },
  { id: 'chanel', name: 'Chanel', faName: 'شنل', cat: 'مد و پوشاک', hasImage: false, fallback: 'CHANEL' },
  { id: 'prada', name: 'Prada', faName: 'پرادا', cat: 'کیف و کفش', hasImage: false, fallback: 'PRADA' },
  { id: 'dior', name: 'Dior', faName: 'دیور', cat: 'مد و پوشاک', hasImage: false, fallback: 'DIOR' },
  { id: 'hermes', name: 'Hermès', faName: 'هرمس', cat: 'کیف و کفش', hasImage: false, fallback: 'HERMÈS' },
  { id: 'rolex', name: 'Rolex', faName: 'رولکس', cat: 'ساعت و اکسسوری', hasImage: false, fallback: 'ROLEX' },
  { id: 'cartier', name: 'Cartier', faName: 'کارتیر', cat: 'ساعت و اکسسوری', hasImage: false, fallback: 'Cartier' },
  { id: 'nike', name: 'Nike', faName: 'نایک نایکی', cat: 'ورزشی ( اسپورت )', hasImage: true, img: '/images/logo/NIKE.svg' },
  { id: 'adidas', name: 'Adidas', faName: 'آدیداس ادیداس', cat: 'ورزشی ( اسپورت )', hasImage: true, img: '/images/logo/adidas.png' },
  { id: 'shein', name: 'Shein', faName: 'شی این', cat: 'مد و پوشاک', hasImage: true, img: '/images/logo/Shein.png' },
  { id: 'apple', name: 'Apple', faName: 'اپل', cat: 'تکنولوژی', hasImage: false, fallback: '' },
  { id: 'samsung', name: 'Samsung', faName: 'سامسونگ', cat: 'تکنولوژی', hasImage: false, fallback: 'SAMSUNG' },
  { id: 'sephora', name: 'Sephora', faName: 'سفورا', cat: 'عطر و آرایشی', hasImage: false, fallback: 'SEPHORA' },
  { id: 'dyson', name: 'Dyson', faName: 'دایسون', cat: 'خانه و دکوراسیون', hasImage: false, fallback: 'dyson' },
  { id: 'noon', name: 'Noon', faName: 'نون', cat: 'فروشگاه آنلاین', hasImage: true, img: '/images/logo/Noon.webp' },
  { id: 'amazon', name: 'Amazon.ae', faName: 'آمازون امیدی امارات', cat: 'فروشگاه آنلاین', hasImage: true, img: '/images/logo/amazon.png' }
];

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const qLower = query.toLowerCase();
  const searchResults = query.trim() 
    ? mockDatabase.filter(item => 
        item.name.toLowerCase().includes(qLower) || 
        (item.faName && item.faName.includes(qLower)) ||
        item.cat.includes(qLower)
      )
    : [];

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.searchContainer}>
        <div className={styles.searchHeader}>
          {query ? (
            <h1 className={styles.searchTitle}>
              نتایج جستجو برای: <span className={styles.searchQuery}>"{query}"</span>
            </h1>
          ) : (
            <h1 className={styles.searchTitle}>عبارتی برای جستجو وارد کنید</h1>
          )}
        </div>

        {query && searchResults.length > 0 ? (
          <div className={styles.grid}>
            {searchResults.map(item => (
              <div key={item.id} className={styles.card}>
                <div className={styles.logoWrap}>
                  {item.hasImage ? (
                    <img src={item.img} alt={item.name} className={styles.logoImg} />
                  ) : (
                    <div className={styles.logoFallback}>{item.fallback}</div>
                  )}
                </div>
                <h3 className={styles.brandName}>{item.name}</h3>
                <p className={styles.brandCategory}>{item.cat}</p>
                <a href="#" className={styles.linkBtn}>
                  مشاهده برند
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
            ))}
          </div>
        ) : query ? (
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>🔍</div>
            <p className={styles.noResultsText}>متاسفانه نتیجه‌ای برای "{query}" یافت نشد.</p>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{padding: '100px', textAlign: 'center', color: '#fff'}}>در حال جستجو...</div>}>
      <SearchContent />
    </Suspense>
  );
}
