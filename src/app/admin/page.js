import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import { ADMIN_ROUTES } from '@/config/adminNavigation';
import { getCurrentAdmin } from '@/lib/adminAuthorization';

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin(await cookies());

  if (admin) redirect(ADMIN_ROUTES.overview);

  return <AdminLoginForm />;
}
