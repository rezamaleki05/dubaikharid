import 'server-only';

import { NextResponse } from 'next/server';
import { CatalogAttributeDomainError } from '@/lib/adminCatalogAttributeService';

export function catalogAttributeApiError(error, fallbackMessage) {
  if (error instanceof CatalogAttributeDomainError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error?.code === 'P2002') {
    return NextResponse.json({ error: 'رکورد ویژگی تکراری است.', code: 'ATTRIBUTE_DUPLICATE' }, { status: 409 });
  }
  if (error?.code === 'P2003') {
    return NextResponse.json({ error: 'این رکورد هنوز در حال استفاده است.', code: 'ATTRIBUTE_IN_USE' }, { status: 409 });
  }
  console.error(fallbackMessage, error);
  return NextResponse.json({ error: 'عملیات ویژگی‌ها با خطا مواجه شد.' }, { status: 500 });
}

export async function readCatalogAttributeJson(request) {
  try {
    return { body: await request.json() };
  } catch {
    return { response: NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 }) };
  }
}

export function parseIncludeInactive(searchParams) {
  const value = searchParams.get('includeInactive');
  if (value === null) return { value: true };
  if (!['true', 'false'].includes(value)) return { error: 'پارامتر وضعیت ویژگی معتبر نیست.' };
  return { value: value === 'true' };
}
