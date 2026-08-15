import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function AdminUsersLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.ADMIN_USERS_MANAGE}>{children}</AdminPermissionGate>;
}
