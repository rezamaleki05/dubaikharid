import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function OrdersLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.ORDERS_VIEW}>{children}</AdminPermissionGate>;
}
