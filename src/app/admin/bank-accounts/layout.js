import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function BankAccountsLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.SETTINGS_VIEW}>{children}</AdminPermissionGate>;
}
