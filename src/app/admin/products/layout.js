import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function ProductsLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.PRODUCTS_VIEW}>{children}</AdminPermissionGate>;
}
