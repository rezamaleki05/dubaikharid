import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function DashboardLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.DASHBOARD_VIEW}>{children}</AdminPermissionGate>;
}
