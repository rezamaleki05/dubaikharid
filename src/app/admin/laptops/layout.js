import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function LaptopsLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.LAPTOPS_VIEW}>{children}</AdminPermissionGate>;
}
