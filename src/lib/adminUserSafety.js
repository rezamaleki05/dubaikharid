export function getAdminDeletionBlocker({ actingAdminId, target, activeSuperAdminCount }) {
  if (!target) return 'NOT_FOUND';
  if (target.id === actingAdminId) return 'SELF_DELETE';
  if (target.role === 'SUPER_ADMIN' && target.status === 'ACTIVE' && activeSuperAdminCount <= 1) {
    return 'LAST_SUPER_ADMIN';
  }
  return null;
}
