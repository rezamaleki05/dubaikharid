import { redirect } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/customerAuth';
import { NOINDEX_METADATA } from '@/lib/seo';

export const metadata = { title: 'حساب کاربری', ...NOINDEX_METADATA };

export default async function ProfileLayout({ children }) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect('/login');
  return children;
}
