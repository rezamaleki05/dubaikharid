import 'server-only';

import { NextResponse } from 'next/server';
import { ProductInventoryError } from '@/lib/productInventoryDomain';

export async function readProductInventoryJson(request) {
  try {
    return { body: await request.json() };
  } catch {
    return { response: NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 }) };
  }
}

export function productInventoryApiError(error, context) {
  if (error instanceof ProductInventoryError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error?.code === 'P2002') {
    return NextResponse.json({ error: 'کلید یا موجودی تکراری است.', code: 'PRODUCT_INVENTORY_DUPLICATE' }, { status: 409 });
  }
  console.error(context, error);
  return NextResponse.json({ error: 'عملیات موجودی تنوع انجام نشد.' }, { status: 500 });
}
