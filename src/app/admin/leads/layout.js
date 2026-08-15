import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function LeadsLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.PURCHASE_REQUESTS_VIEW}>{children}</AdminPermissionGate>;
}
