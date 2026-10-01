import { NextResponse } from 'next/server';
import { refreshAedRate } from '@/lib/aedRateService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Cron is not configured.' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const result = await refreshAedRate();
  return NextResponse.json({ ok: result.ok, updated: result.updated, reason: result.reason || null }, { status: result.ok ? 200 : 502 });
}
