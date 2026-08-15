'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAdminAuth from '@/hooks/admin/useAdminAuth';
import { ADMIN_ROUTES } from '@/config/adminNavigation';
import AdminLayout from './AdminLayout';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminShellContext = createContext({ leads: [] });

export function useAdminShellData() {
  return useContext(AdminShellContext);
}

export default function AdminShell({ activeTab, children, leadsOverride }) {
  const router = useRouter();
  const { handleLogout } = useAdminAuth();
  const [leads, setLeads] = useState([]);
  const [readNotifIds, setReadNotifIds] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (leadsOverride !== undefined) return;
    try {
      const savedLeads = JSON.parse(localStorage.getItem('dubaiKharidLeads') || '[]');
      setLeads(Array.isArray(savedLeads) ? savedLeads : []);
    } catch {
      setLeads([]);
    }

    try {
      const savedReadNotifIds = JSON.parse(localStorage.getItem('dubaiKharidReadNotifIds') || '[]');
      setReadNotifIds(Array.isArray(savedReadNotifIds) ? savedReadNotifIds : []);
    } catch {
      setReadNotifIds([]);
    }
  }, [leadsOverride]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  const handleSetReadNotifIds = (value) => {
    setReadNotifIds(previous => {
      const nextValue = typeof value === 'function' ? value(previous) : value;
      const safeValue = Array.isArray(nextValue) ? nextValue : [];
      localStorage.setItem('dubaiKharidReadNotifIds', JSON.stringify(safeValue));
      return safeValue;
    });
  };

  const handleTabChange = (tab) => {
    const route = ADMIN_ROUTES[tab];
    if (route) router.push(route);
  };

  const effectiveLeads = leadsOverride === undefined ? leads : leadsOverride;

  return (
    <AdminShellContext.Provider value={{ leads: effectiveLeads, setLeads }}>
      <AdminLayout
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(open => !open)}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        sidebar={
          <AdminSidebar
            activeTab={activeTab}
            handleLogout={handleLogout}
            leads={effectiveLeads}
            onNavigate={() => setIsMobileMenuOpen(false)}
          />
        }
        header={
          <AdminHeader
            leads={effectiveLeads}
            readNotifIds={readNotifIds}
            setReadNotifIds={handleSetReadNotifIds}
            isNotificationsOpen={isNotificationsOpen}
            setIsNotificationsOpen={setIsNotificationsOpen}
            setActiveTab={handleTabChange}
            setSelectedOrderId={null}
          />
        }
      >
        {children}
      </AdminLayout>
    </AdminShellContext.Provider>
  );
}
