import 'server-only';

import { NextResponse } from 'next/server';
import {
  AdminAuthorizationError,
  requireAdminPermission,
} from '@/lib/adminAuthorization';

export async function authorizeAdminApiRequest(request, permission) {
  try {
    return { admin: await requireAdminPermission(request.cookies, permission), response: null };
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
