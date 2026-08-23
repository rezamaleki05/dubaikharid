import { NextResponse } from 'next/server';
import { isValidLaptopId, serializePublicLaptop } from '@/lib/adminLaptops';
import { prisma } from '@/lib/prisma';

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!isValidLaptopId(id)) return NextResponse.json({ error: 'شناسه لپ‌تاپ معتبر نیست.' }, { status: 400 });
  try {
    const laptop = await prisma.laptop.findFirst({ where: { id, status: 'AVAILABLE', archivedAt: null } });
    if (!laptop) return NextResponse.json({ error: 'لپ‌تاپ پیدا نشد.' }, { status: 404 });
    return NextResponse.json(serializePublicLaptop(laptop));
  } catch (error) {
    console.error('Error fetching public laptop:', error);
    return NextResponse.json({ error: 'دریافت لپ‌تاپ با خطا مواجه شد.' }, { status: 500 });
  }
}
