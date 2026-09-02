import 'server-only';

import {
  normalizeProductAttributeValueInputs,
  validateCategoryAttributeConfiguration,
  validateResolvedProductAttributeValues,
} from '@/lib/catalogAttributeDomain';

export class CatalogAttributeDomainError extends Error {
  constructor(message, status = 400, code = 'CATALOG_ATTRIBUTE_ERROR') {
    super(message);
    this.name = 'CatalogAttributeDomainError';
    this.status = status;
    this.code = code;
  }
}

export const catalogAttributeInclude = Object.freeze({
  options: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  categoryAssignments: {
    include: { category: { select: { id: true, name: true, query: true } } },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  },
});

export const categoryAttributeInclude = Object.freeze({
  attribute: {
    include: { options: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
  },
});

const productAttributeValueInclude = Object.freeze({
  categoryAttribute: { include: { attribute: true } },
  attributeOption: true,
});

function conflict(message, code) {
  return new CatalogAttributeDomainError(message, 409, code);
}

function notFound(message, code) {
  return new CatalogAttributeDomainError(message, 404, code);
}

async function activeAttribute(client, id) {
  const attribute = await client.catalogAttribute.findUnique({ where: { id } });
  if (!attribute) throw notFound('ویژگی پیدا نشد.', 'ATTRIBUTE_NOT_FOUND');
  if (!attribute.isActive) throw conflict('ویژگی غیرفعال را نمی‌توان برای داده جدید استفاده کرد.', 'ATTRIBUTE_INACTIVE');
  return attribute;
}

export async function listCatalogAttributes(client, { includeInactive = true } = {}) {
  return client.catalogAttribute.findMany({
    where: includeInactive ? undefined : { isActive: true },
    include: catalogAttributeInclude,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function createCatalogAttribute(client, data) {
  const duplicate = await client.catalogAttribute.findUnique({ where: { code: data.code }, select: { id: true } });
  if (duplicate) throw conflict('ویژگی دیگری با این کد فنی وجود دارد.', 'ATTRIBUTE_CODE_EXISTS');
  return client.catalogAttribute.create({ data, include: catalogAttributeInclude });
}

export async function updateCatalogAttribute(client, id, data) {
  const current = await client.catalogAttribute.findUnique({
    where: { id },
    include: { _count: { select: { options: true, categoryAssignments: true } } },
  });
  if (!current) throw notFound('ویژگی پیدا نشد.', 'ATTRIBUTE_NOT_FOUND');
  if (data.code && data.code !== current.code) {
    if (current._count.options > 0 || current._count.categoryAssignments > 0) {
      throw conflict('کد فنی ویژگیِ استفاده‌شده قابل تغییر نیست.', 'ATTRIBUTE_CODE_IN_USE');
    }
    const duplicate = await client.catalogAttribute.findUnique({ where: { code: data.code }, select: { id: true } });
    if (duplicate) throw conflict('ویژگی دیگری با این کد فنی وجود دارد.', 'ATTRIBUTE_CODE_EXISTS');
  }
  if (data.inputType && data.inputType !== current.inputType
    && (current._count.options > 0 || current._count.categoryAssignments > 0)) {
    throw conflict('نوع ورودی ویژگیِ استفاده‌شده قابل تغییر نیست.', 'ATTRIBUTE_TYPE_IN_USE');
  }
  return client.catalogAttribute.update({ where: { id }, data, include: catalogAttributeInclude });
}

export async function deactivateCatalogAttribute(client, id) {
  const current = await client.catalogAttribute.findUnique({ where: { id }, select: { id: true, isActive: true } });
  if (!current) throw notFound('ویژگی پیدا نشد.', 'ATTRIBUTE_NOT_FOUND');
  if (!current.isActive) return client.catalogAttribute.findUnique({ where: { id }, include: catalogAttributeInclude });
  return client.catalogAttribute.update({ where: { id }, data: { isActive: false }, include: catalogAttributeInclude });
}

export async function listAttributeOptions(client, attributeId, { includeInactive = true } = {}) {
  const attribute = await client.catalogAttribute.findUnique({ where: { id: attributeId }, select: { id: true } });
  if (!attribute) throw notFound('ویژگی پیدا نشد.', 'ATTRIBUTE_NOT_FOUND');
  return client.attributeOption.findMany({
    where: { attributeId, ...(includeInactive ? {} : { isActive: true }) },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function createAttributeOption(client, attributeId, data) {
  const attribute = await activeAttribute(client, attributeId);
  if (data.swatchHex && attribute.inputType !== 'COLOR') {
    throw new CatalogAttributeDomainError('کد رنگ فقط برای ویژگی COLOR مجاز است.');
  }
  const duplicate = await client.attributeOption.findUnique({
    where: { attributeId_code: { attributeId, code: data.code } },
    select: { id: true },
  });
  if (duplicate) throw conflict('این کد مقدار برای ویژگی قبلاً ثبت شده است.', 'OPTION_CODE_EXISTS');
  return client.attributeOption.create({ data: { ...data, attributeId } });
}

export async function updateAttributeOption(client, id, data) {
  const current = await client.attributeOption.findUnique({
    where: { id },
    include: {
      attribute: { select: { inputType: true } },
      _count: { select: { variantOptions: true } },
    },
  });
  if (!current) throw notFound('مقدار ویژگی پیدا نشد.', 'OPTION_NOT_FOUND');
  if (data.swatchHex && current.attribute.inputType !== 'COLOR') {
    throw new CatalogAttributeDomainError('کد رنگ فقط برای ویژگی COLOR مجاز است.');
  }
  if (data.code && data.code !== current.code) {
    if (current._count.variantOptions > 0) {
      throw conflict('کد فنی گزینه‌ای که در تنوع محصول استفاده شده قابل تغییر نیست.', 'OPTION_CODE_IN_USE');
    }
    const duplicate = await client.attributeOption.findUnique({
      where: { attributeId_code: { attributeId: current.attributeId, code: data.code } },
      select: { id: true },
    });
    if (duplicate) throw conflict('این کد مقدار برای ویژگی قبلاً ثبت شده است.', 'OPTION_CODE_EXISTS');
  }
  return client.attributeOption.update({ where: { id }, data });
}

export async function deactivateAttributeOption(client, id) {
  const current = await client.attributeOption.findUnique({ where: { id }, select: { id: true, isActive: true } });
  if (!current) throw notFound('مقدار ویژگی پیدا نشد.', 'OPTION_NOT_FOUND');
  if (!current.isActive) return client.attributeOption.findUnique({ where: { id } });
  return client.attributeOption.update({ where: { id }, data: { isActive: false } });
}

export async function listCategoryAttributes(client, categoryId) {
  const category = await client.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) throw notFound('دسته‌بندی پیدا نشد.', 'CATEGORY_NOT_FOUND');
  return client.categoryAttribute.findMany({
    where: { categoryId },
    include: categoryAttributeInclude,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function assignCategoryAttribute(client, categoryId, data) {
  const [category, attribute] = await Promise.all([
    client.category.findUnique({ where: { id: categoryId }, select: { id: true } }),
    activeAttribute(client, data.attributeId),
  ]);
  if (!category) throw notFound('دسته‌بندی پیدا نشد.', 'CATEGORY_NOT_FOUND');
  const configuration = validateCategoryAttributeConfiguration(attribute.inputType, data);
  if (configuration.error) throw new CatalogAttributeDomainError(configuration.error);
  const duplicate = await client.categoryAttribute.findUnique({
    where: { categoryId_attributeId: { categoryId, attributeId: data.attributeId } },
    select: { id: true },
  });
  if (duplicate) throw conflict('این ویژگی قبلاً به دسته‌بندی اختصاص داده شده است.', 'CATEGORY_ATTRIBUTE_EXISTS');
  return client.categoryAttribute.create({ data: { ...data, categoryId }, include: categoryAttributeInclude });
}

export async function updateCategoryAttribute(client, categoryId, attributeId, data) {
  const current = await client.categoryAttribute.findUnique({
    where: { categoryId_attributeId: { categoryId, attributeId } },
    include: { attribute: true },
  });
  if (!current) throw notFound('ویژگی اختصاص‌یافته به دسته‌بندی پیدا نشد.', 'CATEGORY_ATTRIBUTE_NOT_FOUND');
  const merged = {
    isRequired: data.isRequired ?? current.isRequired,
    isVariantDefining: data.isVariantDefining ?? current.isVariantDefining,
    allowsMultiple: data.allowsMultiple ?? current.allowsMultiple,
    sortOrder: data.sortOrder ?? current.sortOrder,
  };
  const configuration = validateCategoryAttributeConfiguration(current.attribute.inputType, merged);
  if (configuration.error) throw new CatalogAttributeDomainError(configuration.error);
  if (current.isVariantDefining && data.isVariantDefining === false) {
    const variantUseCount = await client.productVariantOption.count({
      where: { attributeId, variant: { product: { categoryId } } },
    });
    if (variantUseCount > 0) {
      throw conflict(
        'این ویژگی در تنوع‌های موجود استفاده شده و نمی‌توان سازنده تنوع بودن آن را غیرفعال کرد.',
        'CATEGORY_ATTRIBUTE_VARIANT_IN_USE',
      );
    }
  }
  return client.categoryAttribute.update({
    where: { categoryId_attributeId: { categoryId, attributeId } },
    data,
    include: categoryAttributeInclude,
  });
}

export async function removeCategoryAttribute(client, categoryId, attributeId) {
  const current = await client.categoryAttribute.findUnique({
    where: { categoryId_attributeId: { categoryId, attributeId } },
    select: { id: true },
  });
  if (!current) throw notFound('ویژگی اختصاص‌یافته به دسته‌بندی پیدا نشد.', 'CATEGORY_ATTRIBUTE_NOT_FOUND');
  const [valueCount, variantUseCount] = await Promise.all([
    client.productAttributeValue.count({ where: { categoryAttributeId: current.id } }),
    client.productVariantOption.count({ where: { attributeId, variant: { product: { categoryId } } } }),
  ]);
  if (valueCount > 0) throw conflict('این تخصیص دارای مقدار محصول است و قابل حذف نیست.', 'CATEGORY_ATTRIBUTE_IN_USE');
  if (variantUseCount > 0) {
    throw conflict('این تخصیص در تنوع‌های محصول استفاده شده و قابل حذف نیست.', 'CATEGORY_ATTRIBUTE_VARIANT_IN_USE');
  }
  await client.categoryAttribute.delete({ where: { id: current.id } });
  return { id: current.id, removed: true };
}

export async function getProductAttributeValues(client, productId) {
  return client.productAttributeValue.findMany({
    where: { productId },
    include: productAttributeValueInclude,
    orderBy: [{ categoryAttribute: { sortOrder: 'asc' } }, { createdAt: 'asc' }],
  });
}

export async function replaceProductAttributeValues(client, { productId, values }) {
  const normalized = normalizeProductAttributeValueInputs(values);
  if (normalized.error) throw new CatalogAttributeDomainError(normalized.error);

  try {
    return await client.$transaction(async tx => {
      const product = await tx.product.findUnique({ where: { id: productId }, select: { id: true, categoryId: true } });
      if (!product) throw notFound('محصول پیدا نشد.', 'PRODUCT_NOT_FOUND');
      if (!product.categoryId && normalized.data.length) {
        throw conflict('محصول بدون دسته‌بندی نمی‌تواند مقدار ویژگی داشته باشد.', 'PRODUCT_CATEGORY_REQUIRED');
      }
      const assignments = product.categoryId ? await tx.categoryAttribute.findMany({
        where: { categoryId: product.categoryId },
        include: { attribute: true },
      }) : [];
      const optionIds = [...new Set(normalized.data.map(item => item.attributeOptionId).filter(Boolean))];
      const options = optionIds.length ? await tx.attributeOption.findMany({ where: { id: { in: optionIds } } }) : [];
      const validated = validateResolvedProductAttributeValues({ assignments, options, values: normalized.data });
      if (validated.error) throw new CatalogAttributeDomainError(validated.error);

      await tx.productAttributeValue.deleteMany({ where: { productId } });
      if (validated.data.length) {
        await tx.productAttributeValue.createMany({
          data: validated.data.map(value => ({ ...value, productId })),
        });
      }
      return tx.productAttributeValue.findMany({
        where: { productId },
        include: productAttributeValueInclude,
        orderBy: [{ categoryAttribute: { sortOrder: 'asc' } }, { createdAt: 'asc' }],
      });
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof CatalogAttributeDomainError) throw error;
    if (error?.code === 'P2002') throw conflict('مقدار ویژگی محصول تکراری است.', 'PRODUCT_ATTRIBUTE_DUPLICATE');
    throw error;
  }
}

export async function checkProductCategoryAttributeCompatibility(client, { productId, newCategoryId }) {
  const [product, targetAssignments] = await Promise.all([
    client.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        attributeValues: { select: { attributeId: true } },
        variants: { where: { isDefault: false }, select: { id: true } },
      },
    }),
    newCategoryId
      ? client.categoryAttribute.findMany({ where: { categoryId: newCategoryId }, select: { attributeId: true } })
      : Promise.resolve([]),
  ]);
  if (!product) throw notFound('محصول پیدا نشد.', 'PRODUCT_NOT_FOUND');
  const allowed = new Set(targetAssignments.map(item => item.attributeId));
  const invalidAttributeIds = [...new Set(product.attributeValues.map(item => item.attributeId).filter(id => !allowed.has(id)))];
  return {
    compatible: invalidAttributeIds.length === 0 && product.variants.length === 0,
    invalidAttributeIds,
    nonDefaultVariantCount: product.variants.length,
  };
}
