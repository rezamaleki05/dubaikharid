'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import BrandLogosBar from '@/components/BrandLogosBar';
import Calculator from '@/components/Calculator';
import ProductSlider from '@/components/ProductSlider';
import Footer from '@/components/Footer';
import CheckoutModal from '@/components/CheckoutModal';
import styles from './page.module.css';

const categoryIconPaths = {
  laptop: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M1.8 20h20.4M9 20h6" /></>,
  mobile: <><rect x="7" y="2" width="10" height="20" rx="2.3" /><path d="M10 5h4M11 18.5h2" /></>,
  electronics: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14H2.5v5H6v-5H4ZM20 14h1.5v5H18v-5h2Z" /><path d="M18 20c-1.2 1.2-3 2-5 2" /></>,
  watch: <><path d="m9 2-1 4m7-4 1 4M9 22l-1-4m7 4 1-4" /><rect x="6" y="6" width="12" height="12" rx="4" /><circle cx="12" cy="12" r="3.4" /><path d="M12 9.8V12l1.7 1" /></>,
  sneaker: <><path d="M3 15.5c2.5.2 4.2-.5 5.4-2.2l1.4-2 2.6 2.1c2 1.6 4.5 2.5 7.1 2.6 1.1 0 2 .9 2 2v1H3.2A1.7 1.7 0 0 1 1.5 18.3c0-1.4.4-2.3 1.5-2.8Z" /><path d="m8.4 13.3 1.8 1.3m1-2.1 1.7 1.3M4 19v2h16v-2" /></>,
  bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3M8 12v1m8-1v1" /></>,
  beauty: <><path d="M9 2h6v4H9zM8 6h8l1.5 3v11a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V9L8 6Z" /><path d="M9.5 13.5c1.7-1.7 3.3-1.7 5 0-1.7 1.7-3.3 1.7-5 0Z" /></>,
  clothing: <><path d="m8 3-5 3 2.5 5L8 9.5V21h8V9.5l2.5 1.5L21 6l-5-3c-.7 1.5-2 2.2-4 2.2S8.7 4.5 8 3Z" /></>,
  kids: <><path d="m12 2 2.2 4.7L19 9l-4.8 2.3L12 16l-2.2-4.7L5 9l4.8-2.3L12 2Z" /><path d="M5 17.5 3 22l4.5-2M19 17.5l2 4.5-4.5-2" /></>
};

function CategoryIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {categoryIconPaths[name]}
    </svg>
  );
}

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOrderData, setModalOrderData] = useState(null);

  const handleSelectProduct = (product) => {
    setSelectedProduct({
      link: product.link,
      price: product.priceAed,
      weight: product.weight,
      category: product.category,
      name: product.name,
      brand: product.brand,
      ...(product.product_type === 'laptop_stock' ? { laptopId: product.id, product_type: product.product_type } : {})
    });
  };

  const handleOrderSubmit = (orderData) => {
    setModalOrderData(orderData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalOrderData(null);
  };

  const quickCategories = [
    { name: 'لپ‌تاپ', icon: 'laptop', href: '/stock-laptops' },
    { name: 'موبایل', icon: 'mobile', href: '/mobile' },
    { name: 'لوازم الکترونیک', icon: 'electronics', href: '/electronics' },
    { name: 'ساعت مچی', icon: 'watch', href: '/watches' },
    { name: 'کفش ورزشی', icon: 'sneaker', href: '/sports-shoes' },
    { name: 'کیف و اکسسوری', icon: 'bag', href: '/bags-accessories' },
    { name: 'زیبایی و سلامت', icon: 'beauty', href: '/beauty-health' },
    { name: 'پوشاک و لباس', icon: 'clothing', href: '/clothing' },
    { name: 'کودک و سرگرمی', icon: 'kids', href: '/kids' }
  ];

  return (
    <div className={styles.pageLayout}>
      <Header />

      <main className={styles.mainContent}>
        {/* Hero with background image */}
        <Hero />
        
        {/* Brand logos bar in glassmorphism container */}
        <BrandLogosBar />

        {/* Dubai price calculator */}
        <Calculator initialValues={selectedProduct} onOrderSubmit={handleOrderSubmit} />

        {/* Quick categories */}
        <section className={styles.categoriesSection}>
          <div className="container">
            <div className={styles.catHeader}>
              <h2 className={styles.catTitle}>دسته‌بندی‌های محبوب خرید از دبی</h2>
              <p className={styles.catSubtitle}>محبوب‌ترین گروه‌های کالایی که کاربران به صورت مستقیم از دبی سفارش می‌دهند</p>
            </div>
            <div className={styles.categoriesGrid}>
              {quickCategories.map((cat) => (
                <Link key={cat.href} href={cat.href} className={styles.catCard} aria-label={`مشاهده دسته‌بندی ${cat.name}`}>
                  <div className={styles.catIcon}><CategoryIcon name={cat.icon} /></div>
                  <h3 className={styles.catName}>{cat.name}</h3>
                  <span className={styles.catCount}>مشاهده و انتخاب</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Products sliders */}
        <ProductSlider onSelectProduct={handleSelectProduct} />
      </main>

      <Footer />

      <CheckoutModal
        isOpen={isModalOpen}
        orderData={modalOrderData}
        onClose={handleCloseModal}
      />
    </div>
  );
}
