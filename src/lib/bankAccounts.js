import 'server-only';

import { prisma } from '@/lib/prisma';

function latinDigits(value) {
  return String(value || '')
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

export function normalizeCardNumber(value) {
  return latinDigits(value).replace(/[^0-9]/g, '');
}

export function normalizeIban(value) {
  return latinDigits(value).replace(/[\s-]/g, '').toUpperCase();
}

function validLuhn(value) {
  let sum = 0;
  for (let index = 0; index < value.length; index += 1) {
    const digit = Number(value[index]);
    const weighted = index % 2 === 0 ? digit * 2 : digit;
    sum += weighted > 9 ? weighted - 9 : weighted;
  }
  return sum % 10 === 0;
}

function cleanText(value, maximum) {
  if (typeof value !== 'string') return null;
  const clean = value.trim().replace(/\s+/g, ' ');
  return clean && clean.length <= maximum ? clean : null;
}

export function validateBankAccountInput(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'بدنه درخواست معتبر نیست.' };
  const allowed = new Set(['bankName', 'cardNumber', 'iban', 'accountHolderName', 'isActive', 'isDefault']);
  if (Object.keys(body).some(key => !allowed.has(key))) return { error: 'فیلد غیرمجاز در اطلاعات حساب بانکی وجود دارد.' };
  const data = {};
  for (const [key, maximum] of [['bankName', 120], ['accountHolderName', 160]]) {
    if (!Object.hasOwn(body, key)) {
      if (!partial) return { error: 'اطلاعات الزامی حساب بانکی کامل نیست.', field: key };
      continue;
    }
    const value = cleanText(body[key], maximum);
    if (!value) return { error: 'اطلاعات متنی حساب بانکی معتبر نیست.', field: key };
    data[key] = value;
  }
  if (Object.hasOwn(body, 'cardNumber') || !partial) {
    const cardNumber = normalizeCardNumber(body.cardNumber);
    if (cardNumber.length !== 16 || !validLuhn(cardNumber)) return { error: 'شماره کارت معتبر نیست.', field: 'cardNumber' };
    data.cardNumber = cardNumber;
  }
  if (Object.hasOwn(body, 'iban') || !partial) {
    const iban = normalizeIban(body.iban);
    if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(iban)) return { error: 'شماره شبا معتبر نیست.', field: 'iban' };
    data.iban = iban;
  }
  for (const key of ['isActive', 'isDefault']) {
    if (!Object.hasOwn(body, key)) continue;
    if (typeof body[key] !== 'boolean') return { error: 'وضعیت حساب بانکی معتبر نیست.', field: key };
    data[key] = body[key];
  }
  if (data.isDefault === true && data.isActive === false) return { error: 'حساب پیش‌فرض باید فعال باشد.' };
  return { data };
}

export function serializeBankAccount(account) {
  return {
    id: account.id,
    bankName: account.bankName,
    cardNumber: account.cardNumber,
    iban: account.iban,
    accountHolderName: account.accountHolderName,
    isActive: account.isActive,
    isDefault: account.isDefault,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

async function promoteFirstActive(tx, excludedId = null) {
  const replacement = await tx.bankAccount.findFirst({
    where: { isActive: true, ...(excludedId ? { id: { not: excludedId } } : {}) },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  if (replacement) await tx.bankAccount.update({ where: { id: replacement.id }, data: { isDefault: true } });
  return replacement;
}

export async function createBankAccount(data) {
  return prisma.$transaction(async tx => {
    const count = await tx.bankAccount.count();
    const makeDefault = data.isActive !== false && (data.isDefault === true || count === 0);
    if (makeDefault) await tx.bankAccount.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    return tx.bankAccount.create({ data: { ...data, isDefault: makeDefault } });
  }, { isolationLevel: 'Serializable' });
}

export async function updateBankAccount(id, data) {
  return prisma.$transaction(async tx => {
    const current = await tx.bankAccount.findUnique({ where: { id } });
    if (!current) return null;
    const nextActive = data.isActive ?? current.isActive;
    const requestedDefault = data.isDefault;
    if (requestedDefault === true && !nextActive) throw new Error('DEFAULT_MUST_BE_ACTIVE');
    if (requestedDefault === true) await tx.bankAccount.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } });
    const updated = await tx.bankAccount.update({
      where: { id },
      data: {
        ...data,
        ...(requestedDefault === true ? { isDefault: true } : {}),
        ...(!nextActive ? { isDefault: false } : {}),
      },
    });
    if (current.isDefault && (!nextActive || requestedDefault === false)) await promoteFirstActive(tx, id);
    return updated;
  }, { isolationLevel: 'Serializable' });
}

export async function deleteBankAccount(id) {
  return prisma.$transaction(async tx => {
    const current = await tx.bankAccount.findUnique({ where: { id } });
    if (!current) return null;
    await tx.bankAccount.delete({ where: { id } });
    if (current.isDefault) await promoteFirstActive(tx, id);
    return current;
  }, { isolationLevel: 'Serializable' });
}

export async function getDefaultActiveBankAccount(client = prisma) {
  return client.bankAccount.findFirst({
    where: { isActive: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });
}
