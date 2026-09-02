import 'server-only';

import {
  buildProductVariantSignature,
  DEFAULT_PRODUCT_VARIANT_SIGNATURE,
  MAX_PRODUCT_VARIANT_COMBINATIONS,
  PRODUCT_VARIANT_WARNING_THRESHOLD,
  variantCapacityResult,
} from '@/lib/productVariantDomain';

export class ProductVariantDomainError extends Error {
  constructor(message, status = 400, code = 'PRODUCT_VARIANT_ERROR') {
    super(message);
    this.name = 'ProductVariantDomainError';
    this.status = status;
    this.code = code;
  }
}

const productVariantInclude = Object.freeze({
  options: {
    include: {
      attribute: { select: { id: true, code: true, nameFa: true, nameEn: true, isActive: true } },
      attributeOption: {
        select: { id: true, code: true, labelFa: true, labelEn: true, swatchHex: true, isActive: true },
      },
    },
    orderBy: { attribute: { code: 'asc' } },
  },
});

function conflict(message, code) {
  return new ProductVariantDomainError(message, 409, code);
}

function notFound(message, code) {
  return new ProductVariantDomainError(message, 404, code);
}

export function serializeProductVariant(variant) {
  return {
    id: variant.id,
    sku: variant.sku,
    optionSignature: variant.optionSignature,
    isDefault: variant.isDefault,
    isActive: variant.isActive,
    sortOrder: variant.sortOrder,
    options: (variant.options || []).map(row => ({
      attributeId: row.attributeId,
      attributeCode: row.attribute.code,
      attributeNameFa: row.attribute.nameFa,
      attributeNameEn: row.attribute.nameEn,
      optionId: row.attributeOptionId,
      optionCode: row.attributeOption.code,
      labelFa: row.attributeOption.labelFa,
      labelEn: row.attributeOption.labelEn,
      swatchHex: row.attributeOption.swatchHex,
    })),
  };
}

export async function ensureDefaultProductVariant(client, productId) {
  return client.productVariant.upsert({
    where: { productId_optionSignature: { productId, optionSignature: DEFAULT_PRODUCT_VARIANT_SIGNATURE } },
    create: {
      productId,
      optionSignature: DEFAULT_PRODUCT_VARIANT_SIGNATURE,
      isDefault: true,
      isActive: true,
      sortOrder: 0,
    },
    update: {},
    include: productVariantInclude,
  });
}

export async function listProductVariants(client, productId) {
  const product = await client.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw notFound('محصول پیدا نشد.', 'PRODUCT_NOT_FOUND');
  const variants = await client.productVariant.findMany({
    where: { productId },
    include: productVariantInclude,
    orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return variants.map(serializeProductVariant);
}

async function loadVariantContext(client, productId, optionIds) {
  const product = await client.product.findUnique({
    where: { id: productId },
    select: { id: true, categoryId: true },
  });
  if (!product) throw notFound('محصول پیدا نشد.', 'PRODUCT_NOT_FOUND');

  if (optionIds.length === 0) {
    return { product, axes: [], selections: [], optionSignature: DEFAULT_PRODUCT_VARIANT_SIGNATURE, isDefault: true };
  }
  if (!product.categoryId) {
    throw conflict('محصول بدون دسته‌بندی نمی‌تواند تنوع گزینه‌دار داشته باشد.', 'PRODUCT_CATEGORY_REQUIRED');
  }

  const [assignments, options] = await Promise.all([
    client.categoryAttribute.findMany({
      where: { categoryId: product.categoryId, isVariantDefining: true, attribute: { isActive: true } },
      include: { attribute: true },
      orderBy: [{ sortOrder: 'asc' }, { attribute: { code: 'asc' } }],
    }),
    client.attributeOption.findMany({
      where: { id: { in: optionIds } },
      include: { attribute: true },
    }),
  ]);
  if (options.length !== optionIds.length) {
    throw new ProductVariantDomainError('یک یا چند گزینه ویژگی پیدا نشد.', 400, 'VARIANT_OPTION_NOT_FOUND');
  }

  const assignmentByAttribute = new Map(assignments.map(assignment => [assignment.attributeId, assignment]));
  const seenAttributes = new Set();
  const selections = [];
  for (const optionId of optionIds) {
    const option = options.find(candidate => candidate.id === optionId);
    if (!option.isActive || !option.attribute.isActive) {
      throw conflict('گزینه یا ویژگی غیرفعال را نمی‌توان برای تنوع جدید استفاده کرد.', 'VARIANT_OPTION_INACTIVE');
    }
    if (seenAttributes.has(option.attributeId)) {
      throw new ProductVariantDomainError('برای هر محور تنوع دقیقاً یک گزینه مجاز است.', 400, 'DUPLICATE_VARIANT_ATTRIBUTE');
    }
    seenAttributes.add(option.attributeId);
    if (!assignmentByAttribute.has(option.attributeId)) {
      throw new ProductVariantDomainError(
        'این ویژگی به‌عنوان محور تنوع دسته‌بندی محصول تعریف نشده است.',
        400,
        'ATTRIBUTE_NOT_VARIANT_AXIS',
      );
    }
    selections.push({
      attributeId: option.attributeId,
      attributeOptionId: option.id,
      attributeCode: option.attribute.code,
      optionCode: option.code,
    });
  }
  if (selections.length !== assignments.length) {
    throw new ProductVariantDomainError(
      'برای هر محور فعال تنوع باید دقیقاً یک گزینه انتخاب شود.',
      400,
      'INCOMPLETE_VARIANT_COMBINATION',
    );
  }

  return {
    product,
    axes: assignments,
    selections,
    optionSignature: buildProductVariantSignature(selections),
    isDefault: false,
  };
}

function translatePersistenceError(error) {
  if (error instanceof ProductVariantDomainError) return error;
  if (error?.code === 'P2002') {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : String(error.meta?.target || '');
    if (target.includes('sku')) return conflict('این SKU قبلاً برای تنوع دیگری ثبت شده است.', 'VARIANT_SKU_EXISTS');
    return conflict('این ترکیب تنوع قبلاً برای محصول ثبت شده است.', 'VARIANT_COMBINATION_EXISTS');
  }
  if (error?.code === 'P2003') return conflict('گزینه‌های تنوع با داده‌های مرجع سازگار نیستند.', 'VARIANT_REFERENCE_CONFLICT');
  return error;
}

export async function createProductVariant(client, { productId, data }) {
  try {
    const variant = await client.$transaction(async tx => {
      const resolved = await loadVariantContext(tx, productId, data.optionIds);
      if (!resolved.isDefault) {
        const currentCount = await tx.productVariant.count({ where: { productId, isDefault: false } });
        if (!variantCapacityResult(currentCount).allowed) {
          throw conflict(
            `هر محصول حداکثر می‌تواند ${MAX_PRODUCT_VARIANT_COMBINATIONS} ترکیب تنوع داشته باشد.`,
            'VARIANT_CAP_EXCEEDED',
          );
        }
      }
      return tx.productVariant.create({
        data: {
          productId,
          sku: data.sku,
          optionSignature: resolved.optionSignature,
          isDefault: resolved.isDefault,
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder ?? 0,
          ...(resolved.selections.length ? {
            options: {
              create: resolved.selections.map(selection => ({
                attributeId: selection.attributeId,
                attributeOptionId: selection.attributeOptionId,
              })),
            },
          } : {}),
        },
        include: productVariantInclude,
      });
    }, { isolationLevel: 'Serializable' });
    return serializeProductVariant(variant);
  } catch (error) {
    throw translatePersistenceError(error);
  }
}

export async function previewProductVariantCombinations(client, { productId, combinations }) {
  const existingCount = await client.productVariant.count({ where: { productId, isDefault: false } });
  const signatures = new Set();
  const previews = [];
  for (const optionIds of combinations) {
    const resolved = await loadVariantContext(client, productId, optionIds);
    if (signatures.has(resolved.optionSignature)) {
      throw conflict('یک ترکیب در درخواست پیش‌نمایش تکرار شده است.', 'DUPLICATE_PREVIEW_COMBINATION');
    }
    signatures.add(resolved.optionSignature);
    const existing = await client.productVariant.findUnique({
      where: { productId_optionSignature: { productId, optionSignature: resolved.optionSignature } },
      select: { id: true },
    });
    previews.push({
      optionIds,
      optionSignature: resolved.optionSignature,
      isDefault: resolved.isDefault,
      exists: Boolean(existing),
    });
  }
  const requestedNonDefault = previews.filter(item => !item.isDefault && !item.exists).length;
  const capacity = variantCapacityResult(existingCount, requestedNonDefault);
  if (!capacity.allowed) {
    throw conflict(
      `این درخواست از سقف ${MAX_PRODUCT_VARIANT_COMBINATIONS} ترکیب تنوع عبور می‌کند.`,
      'VARIANT_CAP_EXCEEDED',
    );
  }
  return {
    combinations: previews,
    existingNonDefaultCount: existingCount,
    resultingNonDefaultCount: capacity.total,
    warning: capacity.warning,
    warningThreshold: PRODUCT_VARIANT_WARNING_THRESHOLD,
    hardLimit: MAX_PRODUCT_VARIANT_COMBINATIONS,
  };
}

export async function updateProductVariant(client, id, data) {
  try {
    const current = await client.productVariant.findUnique({ where: { id }, select: { id: true } });
    if (!current) throw notFound('تنوع محصول پیدا نشد.', 'VARIANT_NOT_FOUND');
    const variant = await client.productVariant.update({ where: { id }, data, include: productVariantInclude });
    return serializeProductVariant(variant);
  } catch (error) {
    throw translatePersistenceError(error);
  }
}

export async function deactivateProductVariant(client, id) {
  const current = await client.productVariant.findUnique({ where: { id }, select: { id: true, isActive: true } });
  if (!current) throw notFound('تنوع محصول پیدا نشد.', 'VARIANT_NOT_FOUND');
  if (!current.isActive) {
    return serializeProductVariant(await client.productVariant.findUnique({ where: { id }, include: productVariantInclude }));
  }
  return updateProductVariant(client, id, { isActive: false });
}

export async function replaceProductVariantOptions(client, id, optionIds) {
  try {
    const variant = await client.$transaction(async tx => {
      const current = await tx.productVariant.findUnique({ where: { id }, select: { id: true, productId: true, isDefault: true } });
      if (!current) throw notFound('تنوع محصول پیدا نشد.', 'VARIANT_NOT_FOUND');
      if (current.isDefault) {
        throw conflict('گزینه‌های تنوع پیش‌فرض قابل تغییر نیستند.', 'DEFAULT_VARIANT_OPTIONS_IMMUTABLE');
      }
      const resolved = await loadVariantContext(tx, current.productId, optionIds);
      if (resolved.isDefault) {
        throw new ProductVariantDomainError('تنوع گزینه‌دار نمی‌تواند به تنوع پیش‌فرض تبدیل شود.');
      }
      await tx.productVariantOption.deleteMany({ where: { variantId: id } });
      await tx.productVariantOption.createMany({
        data: resolved.selections.map(selection => ({
          variantId: id,
          attributeId: selection.attributeId,
          attributeOptionId: selection.attributeOptionId,
        })),
      });
      return tx.productVariant.update({
        where: { id },
        data: { optionSignature: resolved.optionSignature },
        include: productVariantInclude,
      });
    }, { isolationLevel: 'Serializable' });
    return serializeProductVariant(variant);
  } catch (error) {
    throw translatePersistenceError(error);
  }
}
