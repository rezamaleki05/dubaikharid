import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function BrandsLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.BRANDS_MANAGE}>{children}</AdminPermissionGate>;
}
