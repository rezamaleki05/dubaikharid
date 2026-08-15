import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function FinancialReportsLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.FINANCIAL_REPORTS_VIEW}>{children}</AdminPermissionGate>;
}
