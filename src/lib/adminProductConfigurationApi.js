import { NextResponse } from 'next/server';
import { AdminProductConfigurationError } from '@/lib/adminProductConfigurationService';
import { CatalogAttributeDomainError } from '@/lib/adminCatalogAttributeService';
import { ProductInventoryError } from '@/lib/productInventoryDomain';
import { ProductSupplyPricingError } from '@/lib/productSupplyPricingDomain';

export async function readAdminProductConfigurationJson(request) {
  try {
    return { body: await request.json() };
  } catch {
    return {
      response: NextResponse.json({ error: 'بدنه درخواست معتبر نیست.' }, { status: 400 }),
    };
  }
}

export function adminProductConfigurationApiError(error, context) {
  if (error instanceof AdminProductConfigurationError
    || error instanceof CatalogAttributeDomainError
    || error instanceof ProductInventoryError
    || error instanceof ProductSupplyPricingError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status || 400 },
    );
  }
  console.error(context, error);
  return NextResponse.json({ error: 'ذخیره تنظیمات محصول انجام نشد.' }, { status: 500 });
}
