import 'server-only';

import { compare } from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { normalizeCustomerPhone } from '@/lib/adminCustomers';
import { prisma } from '@/lib/prisma';
import { getCustomerSessionSecret, getGoogleOAuthConfig } from '@/lib/env';

const LOGIN_WINDOW_MS = 5 * 60_000;
const LOGIN_ATTEMPT_LIMIT = 8;
const loginBuckets = globalThis.__dubaiKharidCustomerLoginBuckets || new Map();
globalThis.__dubaiKharidCustomerLoginBuckets = loginBuckets;

const googleOAuth = getGoogleOAuthConfig();
export const isGoogleAuthConfigured = Boolean(googleOAuth);

function isCustomerActive(status) {
  return status === 'active' || status === 'vip';
}

function clientAddress(request) {
  const headers = request?.headers;
  const forwarded = typeof headers?.get === 'function'
    ? headers.get('x-forwarded-for')
    : headers?.['x-forwarded-for'];
  const direct = typeof headers?.get === 'function'
    ? headers.get('x-real-ip')
    : headers?.['x-real-ip'];
  return String(forwarded || direct || 'local').split(',')[0].trim();
}

function consumeLoginAttempt(request, normalizedPhone) {
  const now = Date.now();
  const key = `${clientAddress(request)}:${normalizedPhone || 'invalid'}`;
  const current = loginBuckets.get(key);
  if (!current || current.resetAt <= now) {
    loginBuckets.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  if (current.count >= LOGIN_ATTEMPT_LIMIT) return false;
  current.count += 1;
  return true;
}

function clearLoginAttempts(request, normalizedPhone) {
  loginBuckets.delete(`${clientAddress(request)}:${normalizedPhone}`);
}

async function authorizeCredentials(credentials, request) {
  const normalizedPhone = normalizeCustomerPhone(credentials?.phone);
  const password = typeof credentials?.password === 'string' ? credentials.password : '';
  if (!consumeLoginAttempt(request, normalizedPhone)) return null;
  if (!normalizedPhone || password.length < 8 || password.length > 256) return null;

  const customer = await prisma.customer.findUnique({
    where: { normalizedPhone },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      status: true,
      sessionVersion: true,
    },
  });
  if (!customer?.passwordHash || !isCustomerActive(customer.status)) return null;
  if (!(await compare(password, customer.passwordHash))) return null;

  clearLoginAttempts(request, normalizedPhone);
  return {
    id: customer.id,
    customerId: customer.id,
    sessionVersion: customer.sessionVersion,
    name: customer.name,
    email: customer.email,
  };
}

async function linkGoogleCustomer({ user, account, profile }) {
  const providerAccountId = String(account?.providerAccountId || '').trim();
  const email = typeof profile?.email === 'string' ? profile.email.trim().toLowerCase() : '';
  if (!providerAccountId || !email || profile?.email_verified !== true) return false;

  const linked = await prisma.customerOAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider: 'google', providerAccountId } },
    include: { customer: true },
  });

  let customer = linked?.customer || null;
  if (!customer) {
    const matches = await prisma.customer.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      orderBy: { createdAt: 'asc' },
      take: 2,
    });
    if (matches.length > 1) return false;

    customer = await prisma.$transaction(async tx => {
      const selected = matches[0] || await tx.customer.create({
        data: {
          name: String(profile?.name || user?.name || email).trim().slice(0, 160),
          phone: '',
          email,
          group: 'سایت',
          status: 'active',
        },
      });
      await tx.customerOAuthAccount.create({
        data: { customerId: selected.id, provider: 'google', providerAccountId },
      });
      return selected;
    });
  }

  if (!isCustomerActive(customer.status)) return false;
  user.customerId = customer.id;
  user.sessionVersion = customer.sessionVersion;
  user.name = customer.name;
  user.email = customer.email;
  return true;
}

const providers = [
  CredentialsProvider({
    name: 'Customer credentials',
    credentials: {
      phone: { label: 'phone', type: 'text' },
      password: { label: 'password', type: 'password' },
    },
    authorize: authorizeCredentials,
  }),
];

if (isGoogleAuthConfigured) {
  providers.push(GoogleProvider({
    clientId: googleOAuth.clientId,
    clientSecret: googleOAuth.clientSecret,
  }));
}

export const customerAuthOptions = {
  providers,
  secret: getCustomerSessionSecret(),
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  callbacks: {
    async signIn(context) {
      if (context.account?.provider !== 'google') return true;
      try {
        return await linkGoogleCustomer(context);
      } catch (error) {
        console.error('Customer Google account linking failed:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user?.customerId) {
        token.customerId = user.customerId;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && typeof token.customerId === 'string') {
        session.user.customerId = token.customerId;
        session.user.sessionVersion = Number(token.sessionVersion || 0);
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
};
