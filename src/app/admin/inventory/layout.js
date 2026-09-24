import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function InventoryLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.PRODUCTS_VIEW}>{children}</AdminPermissionGate>;
}
