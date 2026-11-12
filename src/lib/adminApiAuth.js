import { accessoryAdminBoundary } from '@/lib/accessoryAdminBoundary';
import 'server-only';

import { NextResponse } from 'next/server';
import {
  AdminAuthorizationError,
  requireAnyAdminPermission,
  requireAdminPermission,
} from '@/lib/adminAuthorization';

export async function authorizeAdminApiRequest(request, permission) {
  try {
    const admin=await requireAdminPermission(request.cookies,permission);
    const response=await accessoryAdminBoundary(request,admin);
    return {admin:response?null:admin,response};
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return {
        admin: null,
        response: NextResponse.json(
          { error: error.status === 403 ? 'Forbidden' : 'Unauthorized' },
          { status: error.status },
        ),
      };
    }

    throw error;
  }
}

export async function authorizeAdminApiRequestAny(request, permissions) {
  try {
    const admin=await requireAnyAdminPermission(request.cookies,permissions);
    const response=await accessoryAdminBoundary(request,admin);
    return {admin:response?null:admin,response};
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return {
        admin: null,
        response: NextResponse.json(
          { error: error.status === 403 ? 'Forbidden' : 'Unauthorized' },
          { status: error.status },
        ),
      };
    }

    throw error;
  }
}
