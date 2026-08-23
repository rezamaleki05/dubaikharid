import { NextResponse } from 'next/server';
import { serializePublicLaptop } from '@/lib/adminLaptops';
import { prisma } from '@/lib/prisma';

function positiveInteger(value, fallback, maximum) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= maximum ? parsed : null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = positiveInteger(searchParams.get('page'), 1, 1_000_000);
  const limit = positiveInteger(searchParams.get('limit'), 24, 60);
  if (!page || !limit) return NextResponse.json({ error: 'پارامترهای صفحه‌بندی معتبر نیستند.' }, { status: 400 });
  const where = { status: 'AVAILABLE', archivedAt: null };
  try {
    const [laptops, total] = await Promise.all([
      prisma.laptop.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.laptop.count({ where }),
    ]);
    return NextResponse.json({
      data: laptops.map(serializePublicLaptop),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error('Error fetching public laptops:', error);
    return NextResponse.json({ error: 'دریافت لپ‌تاپ‌ها با خطا مواجه شد.' }, { status: 500 });
  }
}
