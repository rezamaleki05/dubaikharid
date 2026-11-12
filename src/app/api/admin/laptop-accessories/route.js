import { writeAccessory } from "@/lib/laptopAccessoryApi";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeAdminApiRequest } from "@/lib/adminApiAuth";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";
import { accessoryInclude } from "@/lib/laptopAccessoryService";
import {
  ACCESSORY_CATEGORIES,
  ACCESSORY_AUTHENTICITY,
  ACCESSORY_CONDITION,
} from "@/lib/laptopAccessoryDomain";
export async function GET(request) {
  const { response } = await authorizeAdminApiRequest(
    request,
    P.LAPTOP_ACCESSORIES_VIEW,
  );
  if (response) return response;
  const params = new URL(request.url).searchParams;
  const page = Number(params.get("page") || 1),
    limit = 25,
    q = (params.get("search") || "").trim().slice(0, 160);
  const category = params.get("category"),
    authenticity = params.get("authenticity"),
    condition = params.get("condition"),
    status = params.get("status");
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000 ||
    (category && !Object.hasOwn(ACCESSORY_CATEGORIES, category)) ||
    (authenticity && !Object.hasOwn(ACCESSORY_AUTHENTICITY, authenticity)) ||
    (condition && !Object.hasOwn(ACCESSORY_CONDITION, condition)) ||
    (status && !["active", "hidden"].includes(status))
  )
    return NextResponse.json({ error: "فیلتر معتبر نیست." }, { status: 400 });
  const where = {
    accessoryProfile: {
      is: {
        ...(category ? { categorySlug: category } : {}),
        ...(params.get("featured") ? { isFeatured: true } : {}),
      },
    },
    ...(status ? { status } : {}),
    ...(params.get("brand") ? { brandId: params.get("brand") } : {}),
  };
  if (authenticity || condition || params.get("stock"))
    where.variants = {
      some: {
        ...(params.get("stock")
          ? {
              isActive: true,
              inventory: {
                is: { stock: { gt: prisma.productInventory.fields.reserved } },
              },
            }
          : {}),
        ...(authenticity || condition
          ? {
              accessoryOffer: {
                is: {
                  ...(authenticity ? { authenticity } : {}),
                  ...(condition ? { condition } : {}),
                },
              },
            }
          : {}),
      },
    };
  if (q)
    where.OR = [
      { nameFa: { contains: q, mode: "insensitive" } },
      { nameEn: { contains: q, mode: "insensitive" } },
      {
        accessoryProfile: {
          is: { partNumber: { contains: q, mode: "insensitive" } },
        },
      },
      { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
    ];
  const [data, total, brands, models] = await Promise.all([
    prisma.product.findMany({
      where,
      include: accessoryInclude,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.brand.findMany({
      select: { id: true, name: true, faName: true },
      orderBy: { name: "asc" },
    }),
    prisma.laptopModel.findMany({
      where: { active: true },
      include: { brand: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);
  return NextResponse.json({
    data,
    brands,
    models,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}
export async function POST(request) {
  return writeAccessory(request, null);
}
