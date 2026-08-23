import { NextResponse } from 'next/server';
import { getPublicSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { values, missingFinancial } = await getPublicSettings();
    return NextResponse.json(
      { data: values, configured: missingFinancial.length === 0 },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json({ error: 'دریافت تنظیمات عمومی با خطا مواجه شد.' }, { status: 500 });
  }
}
