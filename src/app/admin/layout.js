import { cookies } from 'next/headers';
import AdminAccessProvider from '@/components/admin/AdminAccessProvider';
import { getCurrentAdmin } from '@/lib/adminAuthorization';
import { NOINDEX_METADATA } from '@/lib/seo';

export const metadata = { title: 'پنل مدیریت', ...NOINDEX_METADATA };

export default async function AdminRootLayout({ children }) {
  const admin = await getCurrentAdmin(await cookies()).catch(() => null);
  return <AdminAccessProvider admin={admin}>{children}</AdminAccessProvider>;
}
