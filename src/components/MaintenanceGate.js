'use client';

import { usePathname } from 'next/navigation';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function MaintenanceGate({ children }) {
  const pathname = usePathname();
  const { settings, loaded } = useSiteSettings();
  if (!loaded || pathname?.startsWith('/admin') || !settings.maintenanceMode) return children;

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#fff', color: '#171717', textAlign: 'center' }}>
      <div style={{ maxWidth: '560px' }}>
        <div style={{ color: '#f87820', fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>{settings.siteName}</div>
        <h1 style={{ fontSize: 'clamp(28px, 7vw, 48px)', margin: '0 0 16px', lineHeight: 1.35 }}>سایت موقتاً در حال به‌روزرسانی است</h1>
        <p style={{ color: '#666', lineHeight: 1.9, margin: 0 }}>برای ارائه خدمات بهتر، به‌زودی برمی‌گردیم.</p>
      </div>
    </main>
  );
}
