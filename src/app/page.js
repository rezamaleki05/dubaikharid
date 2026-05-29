'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import BrandLogosBar from '@/components/BrandLogosBar';
import Calculator from '@/components/Calculator';
import ProductSlider from '@/components/ProductSlider';
import Footer from '@/components/Footer';
import CheckoutModal from '@/components/CheckoutModal';
import styles from './page.module.css';

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartCount, setCartCount] = useState(2);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOrderData, setModalOrderData] = useState(null);

  const handleSelectProduct = (product) => {
    setSelectedProduct({
      link: product.link,
      price: product.priceAed,
      weight: product.weight,
      category: product.category,
      name: product.name,
      brand: product.brand
    });
  };

  const handleOrderSubmit = (orderData) => {
    setModalOrderData(orderData);
    setIsModalOpen(true);
  };

  const handleCartIncrement = () => setCartCount(prev => prev + 1);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalOrderData(null);
  };

  const quickCategories = [
    { name: 'لپ‌تاپ',          icon: '💻', count: '۵ مدل پرفروش' },
    { name: 'موبایل',           icon: '📱', count: '۱۲ مدل پرفروش' },
    { name: 'لوازم الکترونیک', icon: '🎧', count: '۸ مدل پرفروش' },
    { name: 'ساعت مچی',        icon: '⌚', count: '۷ مدل پرفروش' },
    { name: 'کفش ورزشی',       icon: '👟', count: '۱۵ مدل پرفروش' },
    { name: 'کیف و اکسسوری',   icon: '👜', count: '۱۰ مدل پرفروش' },
    { name: 'زیبایی و سلامت',  icon: '🧴', count: '۹ مدل پرفروش' },
    { name: 'پوشاک و لباس',    icon: '👕', count: '۱۴ مدل پرفروش' },
    { name: 'کودک و سرگرمی',   icon: '🧸', count: '۶ مدل پرفروش' }
  ];

  return (
    <div className={styles.pageLayout}>
      <Header cartCount={cartCount} />

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
              {quickCategories.map((cat, idx) => (
                <div key={idx} className={styles.catCard}>
                  <div className={styles.catIcon}>{cat.icon}</div>
                  <h3 className={styles.catName}>{cat.name}</h3>
                  <span className={styles.catCount}>{cat.count}</span>
                </div>
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
        onCartIncrement={handleCartIncrement}
      />
    </div>
  );
}
