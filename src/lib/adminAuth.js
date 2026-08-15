import 'server-only';

import { jwtVerify, SignJWT } from 'jose';

export const ADMIN_SESSION_COOKIE = 'dubaiKharidAdminSession';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

const SESSION_ISSUER = 'dubai-kharid-admin';
const SESSION_AUDIENCE = 'dubai-kharid-admin-panel';

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error('Missing required admin authentication environment variable: ADMIN_SESSION_SECRET');
  }

  if (secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters.');
  }

  return new TextEncoder().encode(secret);
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  };
}

export async function createAdminSessionToken(admin) {
  return new SignJWT({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(admin.id)
    .setIssuedAt()
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE}s`)
    .sign(getSessionSecret());
}

export async function verifyAdminSessionToken(token) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ['HS256'],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    if (typeof payload.sub !== 'string' || payload.adminId !== payload.sub) return null;

    return {
      adminId: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      role: typeof payload.role === 'string' ? payload.role : null,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(cookieStore) {
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
