import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function StoresLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.STORES_MANAGE}>{children}</AdminPermissionGate>;
}
