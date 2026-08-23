import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function ActivityLogsLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.ACTIVITY_LOGS_VIEW}>{children}</AdminPermissionGate>;
}
