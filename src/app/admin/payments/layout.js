import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function PaymentsLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.PAYMENTS_VIEW}>{children}</AdminPermissionGate>;
}
