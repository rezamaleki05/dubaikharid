import 'server-only';

import { resolveBrandCreateVisibility } from '@/lib/adminBrands';

export const adminBrandInclude = Object.freeze({
  categoryMappings: {
    include: { category: { select: { id: true, name: true, query: true } } },
    orderBy: { category: { name: 'asc' } },
  },
});

export class BrandDomainError extends Error {
  constructor(message, status = 400, code = 'BRAND_ERROR') {
    super(message);
    this.name = 'BrandDomainError';
    this.status = status;
    this.code = code;
  }
}

export function serializeAdminBrand(brand) {
  const { categoryMappings = [], ...data } = brand;
  return { ...data, categories: categoryMappings.map(mapping => mapping.category) };
}

async function assertCategoriesExist(client, categoryIds) {
  if (!categoryIds.length) return;
  const count = await client.category.count({ where: { id: { in: categoryIds } } });
  if (count !== categoryIds.length) {
    throw new BrandDomainError('دسته‌بندی انتخاب‌شده پیدا نشد.', 404, 'CATEGORY_NOT_FOUND');
  }
}

export async function createAdminBrand(prisma, { data, categoryIds = [], quickCreate = false }) {
  return prisma.$transaction(async tx => {
    // Brand.name is not unique in the legacy schema, so serialize creation and enforce
    // a normalized, case-insensitive duplicate rule at the domain boundary.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(742193)`;
    const matches = await tx.$queryRaw`
      SELECT "id" FROM "Brand"
      WHERE LOWER(BTRIM("name")) = LOWER(${data.name})
      LIMIT 1
    `;
    if (matches[0]) {
      throw new BrandDomainError('برندی با این نام از قبل ثبت شده است.', 409, 'BRAND_ALREADY_EXISTS');
    }
    await assertCategoriesExist(tx, categoryIds);
    return tx.brand.create({
      data: {
        ...data,
        supportsLaptop: data.supportsLaptop ?? false,
        showInBrandDirectory: resolveBrandCreateVisibility({
          quickCreate,
          requestedVisibility: data.showInBrandDirectory,
        }),
        ...(categoryIds.length ? {
          categoryMappings: { create: categoryIds.map(categoryId => ({ categoryId })) },
        } : {}),
      },
      include: adminBrandInclude,
    });
  });
}
