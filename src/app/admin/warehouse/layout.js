import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function WarehouseLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.WAREHOUSE_VIEW}>{children}</AdminPermissionGate>;
}
