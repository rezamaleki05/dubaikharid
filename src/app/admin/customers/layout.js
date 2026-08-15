import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function CustomersLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.CUSTOMERS_VIEW}>{children}</AdminPermissionGate>;
}
