import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { createBankAccount, serializeBankAccount, validateBankAccountInput } from '@/lib/bankAccounts';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SETTINGS_VIEW);
  if (response) return response;
  const rows = await prisma.bankAccount.findMany({ orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] });
  return NextResponse.json({ data: rows.map(serializeBankAccount) });
}

export async function POST(request) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SETTINGS_EDIT);
  if (response) return response;
  let body;
  try { body = await request.json(); } catch { body = null; }
  const parsed = validateBankAccountInput(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error, field: parsed.field || null }, { status: 400 });
  try {
    const account = await createBankAccount(parsed.data);
    await logAdminActivity({ adminId: admin.id, action: 'BANK_ACCOUNT_CREATED', entityType: 'BankAccount', entityId: account.id, metadata: { bankName: account.bankName, isDefault: account.isDefault }, request });
    return NextResponse.json({ data: serializeBankAccount(account) }, { status: 201 });
  } catch (error) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'این شماره کارت یا شبا قبلاً ثبت شده است.' }, { status: 409 });
    console.error('Bank account create failed:', error);
    return NextResponse.json({ error: 'ثبت حساب بانکی با خطا مواجه شد.' }, { status: 500 });
  }
}
