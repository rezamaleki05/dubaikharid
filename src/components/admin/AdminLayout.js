import React from 'react';
import styles from '@/app/admin/Admin.module.css';

export default function AdminLayout({ sidebar, header, children, isMobileMenuOpen, onMobileMenuToggle, onMobileMenuClose }) {
  return (
    <div className={styles.pageWrapper}>
      <button
        type="button"
        className={`${styles.mobileMenuButton} ${isMobileMenuOpen ? styles.mobileMenuButtonOpen : ''}`}
        onClick={onMobileMenuToggle}
        aria-label={isMobileMenuOpen ? 'بستن منوی مدیریت' : 'باز کردن منوی مدیریت'}
        aria-expanded={isMobileMenuOpen}
        aria-controls="admin-navigation"
      >
        <span />
        <span />
        <span />
      </button>

      <button
        type="button"
        className={`${styles.mobileMenuBackdrop} ${isMobileMenuOpen ? styles.mobileMenuBackdropVisible : ''}`}
        onClick={onMobileMenuClose}
        aria-label="بستن منوی مدیریت با کلیک بیرون"
        tabIndex={isMobileMenuOpen ? 0 : -1}
      />

      <div className={`${styles.sidebarDrawer} ${isMobileMenuOpen ? styles.sidebarDrawerOpen : ''}`}>
        {sidebar}
      </div>
      
      {/* ── MAIN WORKSPACE CONTENT AREA ── */}
      <div className={styles.workspace}>
        {header}
        
        {/* Dynamic Inner Tab container */}
        <main className={styles.mainContainer}>
          {children}
        </main>
      </div>
    </div>
  );
}
