import 'server-only';

import { NextResponse } from 'next/server';
import { ProductVariantDomainError } from '@/lib/adminProductVariantService';

export function productVariantApiError(error, fallbackMessage) {
  if (error instanceof ProductVariantDomainError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error?.code === 'P2002') {
    return NextResponse.json({ error: 'تنوع محصول تکراری است.', code: 'VARIANT_DUPLICATE' }, { status: 409 });
  }
  if (error?.code === 'P2003') {
    return NextResponse.json({ error: 'داده مرجع تنوع هنوز در حال استفاده است.', code: 'VARIANT_IN_USE' }, { status: 409 });
  }
  console.error(fallbackMessage, error);
  return NextResponse.json({ error: 'عملیات تنوع محصول با خطا مواجه شد.' }, { status: 500 });
}

export async function readProductVariantJson(request) {
  try {
    return { body: await request.json() };
  } catch {
    return { response: NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 }) };
  }
}
