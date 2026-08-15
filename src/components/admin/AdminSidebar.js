import React from 'react';
import Link from 'next/link';
import { ADMIN_ROUTES } from '@/config/adminNavigation';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { useAdminAccess } from './AdminAccessProvider';
import styles from '@/app/admin/Admin.module.css';
import { AdminIcons } from './AdminIcons';

export default function AdminSidebar({
  activeTab,
  leads = [],
  handleLogout,
  onNavigate
}) {
  const { admin, can } = useAdminAccess();
  const ordersCount = leads.filter(l => ['paid', 'processing', 'purchased', 'warehouse_dubai', 'shipped', 'delivered'].includes(l.status)).length;
  const leadsCount = leads.filter(l => ['pending', 'pricing', 'price_tagged', 'approved'].includes(l.status)).length;
  const warehouseCount = leads.filter(l => l.status === 'warehouse_dubai').length;

  const menuItems = [
    {
      key: 'overview',
      label: 'داشبورد',
      href: ADMIN_ROUTES.overview,
      permission: ADMIN_PERMISSIONS.DASHBOARD_VIEW,
      icon: <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
    },
    {
      key: 'orders',
      label: 'سفارشات',
      href: ADMIN_ROUTES.orders,
      permission: ADMIN_PERMISSIONS.ORDERS_VIEW,
      icon: <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
      badge: ordersCount
    },
    {
      key: 'leads',
      label: 'درخواست خرید',
      href: ADMIN_ROUTES.leads,
      permission: ADMIN_PERMISSIONS.PURCHASE_REQUESTS_VIEW,
      icon: <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      badge: leadsCount
    },
    {
      key: 'products',
      label: 'محصولات خارجی',
      href: ADMIN_ROUTES.products,
      permission: ADMIN_PERMISSIONS.PRODUCTS_VIEW,
      icon: <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
    },
    {
      key: 'warehouse',
      label: 'انبار',
      href: ADMIN_ROUTES.warehouse,
      permission: ADMIN_PERMISSIONS.WAREHOUSE_VIEW,
      icon: AdminIcons.building(16),
      badge: warehouseCount
    },
    {
      key: 'stock_laptops',
      label: 'لپ تاپ های استوک',
      href: ADMIN_ROUTES.stock_laptops,
      permission: ADMIN_PERMISSIONS.LAPTOPS_VIEW,
      icon: <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/><line x1="12" y1="17" x2="12" y2="20"/></svg>
    },
    {
      key: 'customers',
      label: 'مشتریان',
      href: ADMIN_ROUTES.customers,
      permission: ADMIN_PERMISSIONS.CUSTOMERS_VIEW,
      icon: <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
    },
    {
      key: 'payments',
      label: 'پرداخت ها',
      href: ADMIN_ROUTES.payments,
      permission: ADMIN_PERMISSIONS.PAYMENTS_VIEW,
      icon: <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    },
    {
      key: 'shipments',
      label: 'ارسال ها',
      href: ADMIN_ROUTES.shipments,
      permission: ADMIN_PERMISSIONS.SHIPMENTS_VIEW,
      icon: <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
    },
    {
      key: 'financial_reports',
      label: 'گزارش مالی',
      href: ADMIN_ROUTES.financial_reports,
      permission: ADMIN_PERMISSIONS.FINANCIAL_REPORTS_VIEW,
      icon: <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    },
    {
      key: 'brands',
      label: 'برندها',
      href: ADMIN_ROUTES.brands,
      permission: ADMIN_PERMISSIONS.BRANDS_MANAGE,
      icon: AdminIcons.tag(16)
    },
    {
      key: 'stores',
      label: 'فروشگاه‌ها',
      href: ADMIN_ROUTES.stores,
      permission: ADMIN_PERMISSIONS.STORES_MANAGE,
      icon: AdminIcons.folder(16)
    },
    {
      key: 'categories',
      label: 'دسته‌بندی‌ها',
      href: ADMIN_ROUTES.categories,
      permission: ADMIN_PERMISSIONS.CATEGORIES_MANAGE,
      icon: AdminIcons.folder(16)
    },
    {
      key: 'settings',
      label: 'تنظیمات',
      href: ADMIN_ROUTES.settings,
      permission: ADMIN_PERMISSIONS.SETTINGS_VIEW,
      icon: <svg className={styles.navIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15z"/></svg>
    },
    {
      key: 'admin_users',
      label: 'مدیران سیستم',
      href: ADMIN_ROUTES.admin_users,
      permission: ADMIN_PERMISSIONS.ADMIN_USERS_MANAGE,
      icon: AdminIcons.user(16)
    },
    {
      key: 'activity_logs',
      label: 'گزارش فعالیت‌ها',
      href: ADMIN_ROUTES.activity_logs,
      permission: ADMIN_PERMISSIONS.ACTIVITY_LOGS_VIEW,
      icon: AdminIcons.chart(16)
    }
  ].filter(item => can(item.permission));

  return (
    <aside id="admin-navigation" className={styles.sidebar} aria-label="منوی اصلی مدیریت">
      <div>
        <Link href="/" onClick={onNavigate} className={styles.sidebarLogoArea} style={{ textDecoration: 'none', display: 'flex' }}>
          <span className={styles.sidebarLogoIcon}>{AdminIcons.plane(20)}</span>
          <div className={styles.sidebarLogoText}>
            <span className={styles.logoDubai}>Dubai</span>
            <span className={styles.logoKharid}>Kharid</span>
          </div>
        </Link>

        <ul className={styles.navMenuList}>
          {menuItems.map(item => (
            <li key={item.key} className={styles.navMenuItem}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={`${styles.navMenuLink} ${activeTab === item.key ? styles.navMenuLinkActive : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
                {item.badge !== undefined && (
                  <span className={`${styles.navBadge} ${styles.badgeOrange}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.sidebarProfileCard}>
        <div className={styles.profileInfoRow}>
          <div className={styles.profileAvatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,120,32,0.15)', color: '#f87820' }}>{AdminIcons.user(20)}</div>
          <div className={styles.profileMeta}>
            <h3>{admin?.email || 'مدیر سایت'}</h3>
            <span>{admin?.role || 'مدیر سیستم'}</span>
          </div>
        </div>
        <button onClick={() => { onNavigate?.(); handleLogout(); }} className={styles.exitButton}>
          <span>{AdminIcons.logout(14)}</span> خروج از حساب کاربری
        </button>
      </div>
    </aside>
  );
}
