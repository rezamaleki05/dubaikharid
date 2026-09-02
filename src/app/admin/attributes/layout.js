import AdminPermissionGate from '@/components/admin/AdminPermissionGate';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';

export default function AttributesLayout({ children }) {
  return <AdminPermissionGate permission={ADMIN_PERMISSIONS.CATEGORIES_MANAGE}>{children}</AdminPermissionGate>;
}
