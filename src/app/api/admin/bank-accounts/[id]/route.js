import { NextResponse } from 'next/server';
import { authorizeAdminApiRequest } from '@/lib/adminApiAuth';
import { deleteBankAccount, serializeBankAccount, updateBankAccount, validateBankAccountInput } from '@/lib/bankAccounts';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { logAdminActivity } from '@/lib/adminActivity';

function validId(id) { return typeof id === 'string' && id.length > 0 && id.length <= 160; }

export async function PATCH(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SETTINGS_EDIT);
  if (response) return response;
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: 'شناسه حساب بانکی معتبر نیست.' }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { body = null; }
  const parsed = validateBankAccountInput(body, { partial: true });
  if (parsed.error || !Object.keys(parsed.data || {}).length) return NextResponse.json({ error: parsed.error || 'تغییری ارسال نشده است.', field: parsed.field || null }, { status: 400 });
  try {
    const account = await updateBankAccount(id, parsed.data);
    if (!account) return NextResponse.json({ error: 'حساب بانکی پیدا نشد.' }, { status: 404 });
    await logAdminActivity({ adminId: admin.id, action: 'BANK_ACCOUNT_UPDATED', entityType: 'BankAccount', entityId: id, metadata: { bankName: account.bankName, isActive: account.isActive, isDefault: account.isDefault }, request });
    return NextResponse.json({ data: serializeBankAccount(account) });
  } catch (error) {
    if (error.message === 'DEFAULT_MUST_BE_ACTIVE') return NextResponse.json({ error: 'حساب پیش‌فرض باید فعال باشد.' }, { status: 409 });
    if (error?.code === 'P2002') return NextResponse.json({ error: 'این شماره کارت یا شبا قبلاً ثبت شده است.' }, { status: 409 });
    console.error('Bank account update failed:', error);
    return NextResponse.json({ error: 'ویرایش حساب بانکی با خطا مواجه شد.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { admin, response } = await authorizeAdminApiRequest(request, ADMIN_PERMISSIONS.SETTINGS_EDIT);
  if (response) return response;
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: 'شناسه حساب بانکی معتبر نیست.' }, { status: 400 });
  const account = await deleteBankAccount(id);
  if (!account) return NextResponse.json({ error: 'حساب بانکی پیدا نشد.' }, { status: 404 });
  await logAdminActivity({ adminId: admin.id, action: 'BANK_ACCOUNT_DELETED', entityType: 'BankAccount', entityId: id, metadata: { bankName: account.bankName, wasDefault: account.isDefault }, request });
  return NextResponse.json({ data: { id } });
}
