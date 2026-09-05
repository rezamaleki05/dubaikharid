import 'server-only';

import { randomUUID } from 'node:crypto';
import { adminProductInclude, serializeAdminProduct } from '@/lib/adminProducts';
import {
  CatalogAttributeDomainError,
  categoryAttributeInclude,
} from '@/lib/adminCatalogAttributeService';
import { validateResolvedProductAttributeValues } from '@/lib/catalogAttributeDomain';
import {
  adjustProductInventoryStockInTransaction,
  initializeProductInventoryInTransaction,
  runSerializableWithRetry,
} from '@/lib/productInventoryService';
import { ProductInventoryError, deriveProductInventoryState } from '@/lib/productInventoryDomain';
import {
  buildProductVariantSignature,
  DEFAULT_PRODUCT_VARIANT_SIGNATURE,
  MAX_PRODUCT_VARIANT_COMBINATIONS,
  PRODUCT_VARIANT_WARNING_THRESHOLD,
} from '@/lib/productVariantDomain';
import { ProductSupplyPricingError } from '@/lib/productSupplyPricingDomain';

export class AdminProductConfigurationError extends Error {
  constructor(message, status = 400, code = 'ADMIN_PRODUCT_CONFIGURATION_INVALID') {
    super(message);
    this.name = 'AdminProductConfigurationError';
    this.status = status;
    this.code = code;
  }
}

const configurationInclude = Object.freeze({
  ...adminProductInclude,
  attributeValues: {
    include: {
      categoryAttribute: { include: { attribute: true } },
      attributeOption: true,
    },
    orderBy: [{ categoryAttribute: { sortOrder: 'asc' } }, { createdAt: 'asc' }],
  },
  variants: {
    include: {
      options: {
        include: { attribute: true, attributeOption: true },
        orderBy: { attribute: { code: 'asc' } },
      },
      inventory: true,
    },
    orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  },
});

function configurationError(message, code, status = 409) {
  return new AdminProductConfigurationError(message, status, code);
}

function decimalString(value, digits) {
  return value === null || value === undefined ? null : value.toFixed(digits);
}

function serializeAttributeValue(value) {
  const numberValue = decimalString(value.numberValue, 6);
  return {
    id: value.id,
    attributeId: value.attributeId,
    categoryAttributeId: value.categoryAttributeId,
    attributeOptionId: value.attributeOptionId,
    textValue: value.textValue,
    numberValue: numberValue
      ? numberValue.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
      : null,
    booleanValue: value.booleanValue,
    attribute: {
      id: value.categoryAttribute.attribute.id,
      code: value.categoryAttribute.attribute.code,
      nameFa: value.categoryAttribute.attribute.nameFa,
      nameEn: value.categoryAttribute.attribute.nameEn,
      inputType: value.categoryAttribute.attribute.inputType,
      unitFa: value.categoryAttribute.attribute.unitFa,
      unitEn: value.categoryAttribute.attribute.unitEn,
    },
    option: value.attributeOption ? {
      id: value.attributeOption.id,
      code: value.attributeOption.code,
      labelFa: value.attributeOption.labelFa,
      labelEn: value.attributeOption.labelEn,
      swatchHex: value.attributeOption.swatchHex,
      isActive: value.attributeOption.isActive,
    } : null,
  };
}

function serializeVariant(variant) {
  return {
    id: variant.id,
    sku: variant.sku,
    optionSignature: variant.optionSignature,
    isDefault: variant.isDefault,
    isActive: variant.isActive,
    sortOrder: variant.sortOrder,
    priceAedOverride: decimalString(variant.priceAedOverride, 2),
    priceTomanOverride: decimalString(variant.priceTomanOverride, 0),
    discountPercentOverride: variant.discountPercentOverride,
    weightOverride: variant.weightOverride,
    options: variant.options.map(row => ({
      attributeId: row.attributeId,
      attributeCode: row.attribute.code,
      attributeNameFa: row.attribute.nameFa,
      attributeNameEn: row.attribute.nameEn,
      optionId: row.attributeOptionId,
      optionCode: row.attributeOption.code,
      labelFa: row.attributeOption.labelFa,
      labelEn: row.attributeOption.labelEn,
      swatchHex: row.attributeOption.swatchHex,
      isActive: row.attributeOption.isActive,
    })),
    inventory: variant.inventory ? {
      id: variant.inventory.id,
      ...deriveProductInventoryState(variant.inventory),
    } : null,
  };
}

export function serializeAdminProductConfiguration(product) {
  return {
    product: serializeAdminProduct(product),
    attributeValues: product.attributeValues.map(serializeAttributeValue),
    variants: product.variants.map(serializeVariant),
  };
}

export async function getAdminCategoryProductConfiguration(client, categoryId) {
  const category = await client.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true, query: true },
  });
  if (!category) throw configurationError('دسته‌بندی پیدا نشد.', 'CATEGORY_NOT_FOUND', 404);
  const assignments = await client.categoryAttribute.findMany({
    where: { categoryId, attribute: { isActive: true } },
    include: categoryAttributeInclude,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return {
    category,
    attributes: assignments.map(assignment => ({
      id: assignment.id,
      attributeId: assignment.attributeId,
      isRequired: assignment.isRequired,
      isVariantDefining: assignment.isVariantDefining,
      allowsMultiple: assignment.allowsMultiple,
      sortOrder: assignment.sortOrder,
      attribute: {
        id: assignment.attribute.id,
        code: assignment.attribute.code,
        nameFa: assignment.attribute.nameFa,
        nameEn: assignment.attribute.nameEn,
        inputType: assignment.attribute.inputType,
        unitFa: assignment.attribute.unitFa,
        unitEn: assignment.attribute.unitEn,
        options: assignment.attribute.options
          .filter(option => option.isActive)
          .map(option => ({
            id: option.id,
            code: option.code,
            labelFa: option.labelFa,
            labelEn: option.labelEn,
            swatchHex: option.swatchHex,
            sortOrder: option.sortOrder,
          })),
      },
    })),
    warningThreshold: PRODUCT_VARIANT_WARNING_THRESHOLD,
    hardLimit: MAX_PRODUCT_VARIANT_COMBINATIONS,
  };
}

export async function getAdminProductConfiguration(client, productId) {
  const product = await client.product.findUnique({
    where: { id: productId },
    include: configurationInclude,
  });
  if (!product) throw configurationError('محصول پیدا نشد.', 'PRODUCT_NOT_FOUND', 404);
  return serializeAdminProductConfiguration(product);
}

function resolveVariantRows(variants, assignments) {
  const axes = assignments.filter(assignment => assignment.isVariantDefining);
  const axisByAttribute = new Map(axes.map(assignment => [assignment.attributeId, assignment]));
  const optionById = new Map(axes.flatMap(assignment => (
    assignment.attribute.options
      .filter(option => option.isActive)
      .map(option => [option.id, { ...option, attribute: assignment.attribute }])
  )));
  const signatures = new Set();
  return variants.map((variant, index) => {
    if (variant.isActive === false) {
      throw configurationError('فقط تنوع‌های قابل فروش را در ماتریس انتخاب کنید.', 'INACTIVE_SELECTED_VARIANT', 400);
    }
    if (axes.length === 0 && variant.optionIds.length !== 0) {
      throw configurationError('محصول بدون محور تنوع فقط می‌تواند تنوع پیش‌فرض داشته باشد.', 'DEFAULT_VARIANT_REQUIRED', 400);
    }
    if (axes.length > 0 && variant.optionIds.length !== axes.length) {
      throw configurationError('برای هر محور تنوع باید دقیقاً یک گزینه انتخاب شود.', 'INCOMPLETE_VARIANT_COMBINATION', 400);
    }
    const seenAttributes = new Set();
    const selections = variant.optionIds.map(optionId => {
      const option = optionById.get(optionId);
      if (!option) {
        throw configurationError('گزینه انتخاب‌شده برای دسته‌بندی معتبر یا فعال نیست.', 'INVALID_CATEGORY_OPTION', 400);
      }
      if (!axisByAttribute.has(option.attributeId) || seenAttributes.has(option.attributeId)) {
        throw configurationError('برای هر محور تنوع دقیقاً یک گزینه مجاز است.', 'DUPLICATE_VARIANT_ATTRIBUTE', 400);
      }
      seenAttributes.add(option.attributeId);
      return {
        attributeId: option.attributeId,
        attributeOptionId: option.id,
        attributeCode: option.attribute.code,
        optionCode: option.code,
      };
    });
    const optionSignature = buildProductVariantSignature(selections);
    if (signatures.has(optionSignature)) {
      throw configurationError('این ترکیب تنوع بیش از یک بار انتخاب شده است.', 'DUPLICATE_VARIANT_COMBINATION', 400);
    }
    signatures.add(optionSignature);
    return {
      ...variant,
      isActive: true,
      sortOrder: variant.sortOrder ?? index,
      selections,
      optionSignature,
      isDefault: optionSignature === DEFAULT_PRODUCT_VARIANT_SIGNATURE,
    };
  });
}

function validateInventoryAndPricing(productData, variants) {
  if (productData.supplyMode === 'EXTERNAL_DUBAI') {
    if (variants.some(variant => variant.inventory !== null)) {
      throw configurationError('برای محصول با تأمین دبی موجودی فیزیکی ثبت نمی‌شود.', 'EXTERNAL_INVENTORY_NOT_ALLOWED', 400);
    }
  } else if (variants.some(variant => !variant.inventory)) {
    throw configurationError(
      'موجودی اولیه برای همه تنوع‌های محصول موجود در ایران الزامی است.',
      'IRAN_INVENTORY_REQUIRED',
      400,
    );
  }
  for (const variant of variants) {
    const inheritedPrice = productData.supplyMode === 'EXTERNAL_DUBAI'
      ? variant.priceAedOverride ?? productData.priceAed
      : variant.priceTomanOverride ?? productData.priceToman;
    if (inheritedPrice === null || inheritedPrice === undefined) {
      throw configurationError('قیمت معتبر برای یکی از تنوع‌ها ثبت نشده است.', 'VARIANT_PRICE_REQUIRED', 400);
    }
  }
}

async function validateRelations(tx, productData) {
  const [category, store, brand] = await Promise.all([
    tx.category.findUnique({ where: { id: productData.categoryId }, select: { id: true } }),
    tx.store.findUnique({ where: { id: productData.storeId }, select: { id: true } }),
    productData.brandId
      ? tx.brand.findUnique({ where: { id: productData.brandId }, select: { id: true } })
      : Promise.resolve({ id: null }),
  ]);
  if (!category) throw configurationError('دسته‌بندی انتخاب‌شده پیدا نشد.', 'CATEGORY_NOT_FOUND', 404);
  if (!store) throw configurationError('فروشگاه انتخاب‌شده پیدا نشد.', 'STORE_NOT_FOUND', 404);
  if (!brand) throw configurationError('برند انتخاب‌شده پیدا نشد.', 'BRAND_NOT_FOUND', 404);
}

async function uniqueSlug(tx, desired, currentProductId = null) {
  const existing = await tx.product.findUnique({ where: { slug: desired }, select: { id: true } });
  if (!existing || existing.id === currentProductId) return desired;
  for (let suffix = 2; suffix <= 20; suffix += 1) {
    const candidate = desired + '-' + suffix;
    const match = await tx.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!match || match.id === currentProductId) return candidate;
  }
  return desired + '-' + randomUUID().slice(0, 8);
}

async function assertEditSafety(tx, current, productData) {
  if (current.categoryId !== productData.categoryId) {
    const [attributeValueCount, nonDefaultVariants, inventoryCount] = await Promise.all([
      tx.productAttributeValue.count({ where: { productId: current.id } }),
      tx.productVariant.count({ where: { productId: current.id, isDefault: false } }),
      tx.productInventory.count({ where: { variant: { productId: current.id } } }),
    ]);
    if (attributeValueCount || nonDefaultVariants || inventoryCount) {
      throw configurationError(
        'این محصول دارای تنوع یا موجودی مرتبط با دسته‌بندی فعلی است و تغییر دسته‌بندی نیاز به بازتنظیم ویژگی‌ها دارد.',
        'PRODUCT_CATEGORY_CONFIGURATION_IN_USE',
      );
    }
  }
  if (current.supplyMode === 'IRAN_STOCK' && productData.supplyMode === 'EXTERNAL_DUBAI') {
    const unsafeInventory = await tx.productInventory.findFirst({
      where: {
        variant: { productId: current.id },
        OR: [{ reserved: { gt: 0 } }, { reservations: { some: { status: 'ACTIVE' } } }],
      },
      select: { id: true },
    });
    if (unsafeInventory) {
      throw configurationError(
        'تا زمانی که رزرو فعال موجودی وجود دارد، روش تأمین قابل تغییر نیست.',
        'PRODUCT_INVENTORY_RESERVATION_ACTIVE',
      );
    }
  }
}

function variantUpdateData(variant) {
  return {
    sku: variant.sku,
    isActive: true,
    sortOrder: variant.sortOrder,
    priceAedOverride: variant.priceAedOverride ?? null,
    priceTomanOverride: variant.priceTomanOverride ?? null,
    discountPercentOverride: variant.discountPercentOverride ?? null,
    weightOverride: variant.weightOverride ?? null,
  };
}

async function assertSkuSafety(tx, rows, productId) {
  const seen = new Set();
  for (const row of rows) {
    if (!row.sku) continue;
    if (seen.has(row.sku)) throw configurationError('SKU تنوع تکراری است.', 'VARIANT_SKU_EXISTS');
    seen.add(row.sku);
  }
  if (!seen.size) return;
  const duplicate = await tx.productVariant.findFirst({
    where: {
      sku: { in: [...seen] },
      ...(productId ? { productId: { not: productId } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) throw configurationError('این SKU قبلاً برای تنوع دیگری ثبت شده است.', 'VARIANT_SKU_EXISTS');
}

export async function saveAdminProductConfiguration(
  client,
  { productId = null, productData, attributeValues, variants, adminId = null },
) {
  try {
    return await runSerializableWithRetry(client, async tx => {
      await validateRelations(tx, productData);
      const current = productId ? await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, categoryId: true, supplyMode: true },
      }) : null;
      if (productId && !current) throw configurationError('محصول پیدا نشد.', 'PRODUCT_NOT_FOUND', 404);
      if (current) await assertEditSafety(tx, current, productData);

      const assignments = await tx.categoryAttribute.findMany({
        where: { categoryId: productData.categoryId, attribute: { isActive: true } },
        include: { attribute: { include: { options: true } } },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
      const options = assignments.flatMap(assignment => assignment.attribute.options);
      const validatedValues = validateResolvedProductAttributeValues({
        assignments,
        options,
        values: attributeValues,
      });
      if (validatedValues.error) throw new CatalogAttributeDomainError(validatedValues.error);

      const resolvedVariants = resolveVariantRows(variants, assignments);
      const hasAxes = assignments.some(assignment => assignment.isVariantDefining);
      if (!hasAxes && (resolvedVariants.length !== 1 || !resolvedVariants[0].isDefault)) {
        throw configurationError('محصول ساده باید دقیقاً یک تنوع پیش‌فرض داشته باشد.', 'DEFAULT_VARIANT_REQUIRED', 400);
      }
      if (hasAxes && resolvedVariants.some(variant => variant.isDefault)) {
        throw configurationError('برای محصول دارای محور تنوع، ترکیب کامل گزینه‌ها الزامی است.', 'VARIANT_OPTIONS_REQUIRED', 400);
      }
      validateInventoryAndPricing(productData, resolvedVariants);
      await assertSkuSafety(tx, resolvedVariants, productId);

      const data = { ...productData };
      data.slug = await uniqueSlug(tx, data.slug, productId);
      const product = current
        ? await tx.product.update({ where: { id: productId }, data })
        : await tx.product.create({ data });

      await tx.productAttributeValue.deleteMany({ where: { productId: product.id } });
      if (validatedValues.data.length) {
        await tx.productAttributeValue.createMany({
          data: validatedValues.data.map(value => ({ ...value, productId: product.id })),
        });
      }

      const existing = await tx.productVariant.findMany({
        where: { productId: product.id },
        include: {
          inventory: {
            include: { reservations: { where: { status: 'ACTIVE' }, select: { id: true }, take: 1 } },
          },
        },
      });
      const existingBySignature = new Map(existing.map(variant => [variant.optionSignature, variant]));
      const selectedSignatures = new Set(resolvedVariants.map(variant => variant.optionSignature));
      const savedVariants = [];

      for (const row of resolvedVariants) {
        const match = existingBySignature.get(row.optionSignature);
        if (row.id && (!match || match.id !== row.id)) {
          throw configurationError('هویت تنوع با ترکیب انتخاب‌شده سازگار نیست.', 'VARIANT_IDENTITY_MISMATCH');
        }
        if (match) {
          savedVariants.push(await tx.productVariant.update({
            where: { id: match.id },
            data: variantUpdateData(row),
            include: { inventory: true },
          }));
        } else {
          savedVariants.push(await tx.productVariant.create({
            data: {
              productId: product.id,
              optionSignature: row.optionSignature,
              isDefault: row.isDefault,
              ...variantUpdateData(row),
              ...(row.selections.length ? {
                options: {
                  create: row.selections.map(selection => ({
                    attributeId: selection.attributeId,
                    attributeOptionId: selection.attributeOptionId,
                  })),
                },
              } : {}),
            },
            include: { inventory: true },
          }));
        }
      }

      for (const stale of existing.filter(variant => (
        variant.isActive && !selectedSignatures.has(variant.optionSignature)
      ))) {
        if (stale.inventory?.reservations.length) {
          throw configurationError(
            'تنوع دارای رزرو فعال است و قابل غیرفعال‌سازی نیست.',
            'VARIANT_ACTIVE_RESERVATION',
          );
        }
        await tx.productVariant.update({ where: { id: stale.id }, data: { isActive: false } });
      }

      if (productData.supplyMode === 'IRAN_STOCK') {
        for (let index = 0; index < savedVariants.length; index += 1) {
          const saved = savedVariants[index];
          const inventoryInput = resolvedVariants[index].inventory;
          if (!saved.inventory) {
            await initializeProductInventoryInTransaction(tx, {
              variantId: saved.id,
              ...inventoryInput,
              adminId,
            });
            continue;
          }
          const inventoryDelta = inventoryInput.stock - saved.inventory.stock;
          if (inventoryInput.stock < saved.inventory.reserved) {
            throw new ProductInventoryError(
              'موجودی کل نمی‌تواند از تعداد رزروشده کمتر باشد.',
              409,
              'INSUFFICIENT_AVAILABLE_STOCK',
            );
          }
          if (inventoryDelta !== 0) {
            await adjustProductInventoryStockInTransaction(tx, {
              inventoryId: saved.inventory.id,
              delta: inventoryDelta,
              reason: 'ویرایش موجودی از فرم محصول',
              idempotencyKey: 'product-config:' + product.id + ':' + saved.id + ':' + randomUUID(),
              adminId,
            });
          }
          await tx.productInventory.update({
            where: { id: saved.inventory.id },
            data: { minStock: inventoryInput.minStock, location: inventoryInput.location },
          });
        }
      }

      const configured = await tx.product.findUnique({
        where: { id: product.id },
        include: configurationInclude,
      });
      return serializeAdminProductConfiguration(configured);
    }, { retryUnique: true, timeout: 20_000 });
  } catch (error) {
    if (error instanceof AdminProductConfigurationError
      || error instanceof CatalogAttributeDomainError
      || error instanceof ProductInventoryError
      || error instanceof ProductSupplyPricingError) throw error;
    if (error?.code === 'P2002') {
      const target = String(error.meta?.target || '');
      if (target.includes('sku')) {
        throw configurationError('این SKU قبلاً برای تنوع دیگری ثبت شده است.', 'VARIANT_SKU_EXISTS');
      }
      throw configurationError('محصول یا ترکیب تنوع تکراری است.', 'PRODUCT_CONFIGURATION_DUPLICATE');
    }
    throw error;
  }
}
