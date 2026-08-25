'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import useAdminAuth from '@/hooks/admin/useAdminAuth';
import AdminLayout from './AdminLayout';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminShellContext = createContext({ leads: [] });
const EMPTY_ALERTS = Object.freeze({
  counts: { orders: 0, purchaseRequests: 0, payments: 0, warehouse: 0, shipments: 0, total: 0 },
  items: [],
});

export function useAdminShellData() {
  return useContext(AdminShellContext);
}

export default function AdminShell({ activeTab, children, leadsOverride }) {
  const { handleLogout } = useAdminAuth();
  const [leads, setLeads] = useState([]);
  const [alertSummary, setAlertSummary] = useState(EMPTY_ALERTS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (leadsOverride !== undefined) return;
    const controller = new AbortController();
    fetch('/api/admin/purchase-requests?limit=100', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'دریافت درخواست‌های خرید با خطا مواجه شد.');
        setLeads(Array.isArray(payload.data) ? payload.data : []);
      })
      .catch(error => {
        if (error.name !== 'AbortError') console.error(error);
      });

    return () => controller.abort();
  }, [leadsOverride]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    const desktopQuery = window.matchMedia('(min-width: 1025px)');
    const handleDesktopChange = (event) => {
      if (event.matches) setIsMobileMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    desktopQuery.addEventListener('change', handleDesktopChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      desktopQuery.removeEventListener('change', handleDesktopChange);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    let active = true;
    const refreshAlerts = async () => {
      try {
        const response = await fetch('/api/admin/alerts', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'دریافت هشدارهای مدیریت ناموفق بود.');
        if (active) setAlertSummary(payload);
      } catch (error) {
        if (active) console.error(error);
      }
    };
    const handleFocus = () => refreshAlerts();
    refreshAlerts();
    const interval = window.setInterval(refreshAlerts, 30_000);
    window.addEventListener('focus', handleFocus);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const effectiveLeads = leadsOverride === undefined ? leads : leadsOverride;

  return (
    <AdminShellContext.Provider value={{ leads: effectiveLeads, setLeads, alertSummary }}>
      <AdminLayout
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(open => !open)}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        sidebar={
          <AdminSidebar
            activeTab={activeTab}
            handleLogout={handleLogout}
            alertSummary={alertSummary}
            onNavigate={() => setIsMobileMenuOpen(false)}
          />
        }
        header={
          <AdminHeader
            alertSummary={alertSummary}
            isNotificationsOpen={isNotificationsOpen}
            setIsNotificationsOpen={setIsNotificationsOpen}
          />
        }
      >
        {children}
      </AdminLayout>
    </AdminShellContext.Provider>
  );
}
