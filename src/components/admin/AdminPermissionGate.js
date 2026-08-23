import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  AdminAuthorizationError,
  requireAdminPermission,
} from '@/lib/adminAuthorization';

export default async function AdminPermissionGate({ permission, children }) {
  try {
    await requireAdminPermission(await cookies(), permission);
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      redirect(error.status === 403 ? '/admin/forbidden' : '/admin');
    }
    throw error;
  }

  return children;
}
