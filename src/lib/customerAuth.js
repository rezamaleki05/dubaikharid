import 'server-only';

import { getServerSession } from 'next-auth';
import { customerAuthOptions } from '@/lib/customerAuthOptions';
import { prisma } from '@/lib/prisma';

export function isCustomerStatusActive(status) {
  return status === 'active' || status === 'vip';
}

export async function getCurrentCustomer() {
  const session = await getServerSession(customerAuthOptions);
  const customerId = session?.user?.customerId;
  if (typeof customerId !== 'string' || !customerId) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      phone: true,
      normalizedPhone: true,
      email: true,
      defaultAddress: true,
      status: true,
      sessionVersion: true,
      createdAt: true,
      updatedAt: true,
      passwordHash: true,
    },
  });
  if (!customer || !isCustomerStatusActive(customer.status)) return null;
  if (customer.sessionVersion !== Number(session.user.sessionVersion || 0)) return null;
  return customer;
}

export function serializeCurrentCustomer(customer) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || '',
    address: customer.defaultAddress || '',
    dateRegistered: customer.createdAt,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customer.name)}&backgroundColor=f87820&textColor=ffffff`,
    authProvider: customer.passwordHash ? 'credentials' : 'oauth',
  };
}
