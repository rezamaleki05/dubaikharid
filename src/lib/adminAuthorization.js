import 'server-only';

import { getAdminSession } from '@/lib/adminAuth';
import { getPermissionsForRole, hasPermission } from '@/lib/adminPermissions';
import { prisma } from '@/lib/prisma';

export class AdminAuthorizationError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AdminAuthorizationError';
    this.status = status;
  }
}

function toSafeAdmin(admin) {
  return {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    permissions: [...getPermissionsForRole(admin.role)],
  };
}

export async function getCurrentAdmin(cookieStore) {
  const session = await getAdminSession(cookieStore);
  if (!session?.adminId) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
    select: { id: true, email: true, role: true, status: true },
  });

  if (!admin || admin.status !== 'ACTIVE') return null;
  return toSafeAdmin(admin);
}

export async function requireAdminPermission(cookieStore, permission) {
  const admin = await getCurrentAdmin(cookieStore);

  if (!admin) {
    throw new AdminAuthorizationError(401, 'Unauthorized');
  }

  if (!hasPermission(admin, permission)) {
    throw new AdminAuthorizationError(403, 'Forbidden');
  }

  return admin;
}

export async function requireAnyAdminPermission(cookieStore, permissions) {
  const admin = await getCurrentAdmin(cookieStore);

  if (!admin) {
    throw new AdminAuthorizationError(401, 'Unauthorized');
  }

  if (!Array.isArray(permissions) || !permissions.some(permission => hasPermission(admin, permission))) {
    throw new AdminAuthorizationError(403, 'Forbidden');
  }

  return admin;
}
