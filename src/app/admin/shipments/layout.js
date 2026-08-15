import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function ShipmentsLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.SHIPMENTS_VIEW}>{children}</AdminPermissionGate>;
}
