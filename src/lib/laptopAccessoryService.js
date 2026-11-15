import "server-only";
import { randomUUID } from "node:crypto";
import { verifyAccessoryBlob } from "./laptopAccessoryUploadDomain";
import { validateAccessory, AccessoryError, accessoryCoverImage } from "./laptopAccessoryDomain";
import {
  accessoryCategoryId,
  accessorySpecCode,
} from "./laptopAccessoryCatalogConfig";
import { buildProductVariantSignature } from "./productVariantDomain";
import {
  runSerializableWithRetry,
  initializeProductInventoryInTransaction,
  adjustProductInventoryStockInTransaction,
} from "./productInventoryService";
export const accessoryInclude = {
  accessoryProfile: {
    include: {
      compatibility: { include: { laptopModel: { include: { brand: true } } } },
    },
  },
  images: { orderBy: { sortOrder: "asc" } },
  brand: true,
  category: true,
  attributeValues: {
    include: { categoryAttribute: { include: { attribute: true } } },
  },
  variants: {
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
    include: {
      inventory: true,
      accessoryOffer: true,
      accessoryImages: { orderBy: { sortOrder: "asc" } },
      options: { include: { attribute: true, attributeOption: true } },
    },
  },
};
export async function saveAccessory(
  client,
  input,
  { id = null, adminId } = {},
) {
  const data = validateAccessory(input);
  const images = [...data.images, ...data.offers.flatMap((x) => x.images)];
  if (images.length > 60)
    throw new AccessoryError("حداکثر ۶۰ تصویر در هر قطعه مجاز است.");
  try {
    for (let i = 0; i < images.length; i += 5)
      await Promise.all(
        images.slice(i, i + 5).map((image) => verifyAccessoryBlob(image)),
      );
  } catch {
    throw new AccessoryError("تصویر آپلودشده قابل تأیید نیست.");
  }
  return runSerializableWithRetry(
    client,
    async (tx) => {
      const current = id
        ? await tx.product.findUnique({
            where: { id },
            include: accessoryInclude,
          })
        : null;
      if (id && !current?.accessoryProfile)
        throw new AccessoryError("قطعه پیدا نشد.", 404);
      if (
        !(await tx.brand.findUnique({
          where: { id: data.product.brandId },
          select: { id: true },
        }))
      )
        throw new AccessoryError("برند معتبر نیست.");
      const models = await tx.laptopModel.count({
        where: { id: { in: data.compatibility }, active: true },
      });
      if (models !== data.compatibility.length)
        throw new AccessoryError("مدل سازگار معتبر نیست.");
      const categoryId = accessoryCategoryId(data.profile.categorySlug);
      const assignments = await tx.categoryAttribute.findMany({
        where: { categoryId },
        include: { attribute: { include: { options: true } } },
      });
      for (const code of ["accessory_authenticity", "accessory_condition"])
        if (
          !assignments.some(
            (x) =>
              x.attribute.code === code &&
              x.isVariantDefining &&
              x.attribute.isActive,
          )
        )
          throw new AccessoryError("ابتدا پیکربندی کاتالوگ را اجرا کنید.", 409);
      const productData = {
        ...data.product,
        name: data.product.nameFa,
        categoryId,
        supplyMode: "IRAN_STOCK",
        priceToman: null,
        priceAed: null,
        image: accessoryCoverImage({ images: data.images, variants: data.offers.map(offer => ({ ...offer, accessoryImages: offer.images, inventory: { stock: offer.stock, reserved: 0 } })) })?.url || null,
      };
      const product = id
        ? await tx.product.update({ where: { id }, data: productData })
        : await tx.product.create({
            data: { ...productData, status: "hidden" },
          });
      await tx.laptopAccessoryProfile.upsert({
        where: { productId: product.id },
        create: { productId: product.id, ...data.profile },
        update: data.profile,
      });
      await tx.laptopAccessoryCompatibility.deleteMany({
        where: { productId: product.id },
      });
      if (data.compatibility.length)
        await tx.laptopAccessoryCompatibility.createMany({
          data: data.compatibility.map((laptopModelId) => ({
            productId: product.id,
            laptopModelId,
          })),
        });
      await tx.productAttributeValue.deleteMany({
        where: { productId: product.id },
      });
      for (const [key, textValue] of Object.entries(data.specs)) {
        if (!textValue) continue;
        const a = assignments.find(
          (x) => x.attribute.code === accessorySpecCode(key),
        );
        if (!a) throw new AccessoryError("مشخصات کاتالوگ ناقص است.", 409);
        await tx.productAttributeValue.create({
          data: {
            productId: product.id,
            categoryAttributeId: a.id,
            attributeId: a.attributeId,
            textValue,
          },
        });
      }
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (data.images.length)
        await tx.productImage.createMany({
          data: data.images.map((x) => ({ ...x, productId: product.id })),
        });
      // Existing variants are never deleted: orders and reservations retain stable identity.
      await tx.productVariant.updateMany({
        where: { productId: product.id },
        data: { isDefault: false, isActive: false },
      });
      for (const offer of data.offers) {
        const options = ["accessory_authenticity", "accessory_condition"].map(
          (code, index) => {
            const a = assignments.find(
              (x) => x.attribute.code === code,
            ).attribute;
            const option = a.options.find(
              (x) =>
                x.code ===
                  (index
                    ? offer.detail.condition
                    : offer.detail.authenticity) && x.isActive,
            );
            if (!option)
              throw new AccessoryError("گزینه کاتالوگ معتبر نیست.", 409);
            return { attributeId: a.id, attributeOptionId: option.id };
          },
        );
        const optionSignature = buildProductVariantSignature([
          {
            attributeCode: "accessory_authenticity",
            optionCode: offer.detail.authenticity,
          },
          {
            attributeCode: "accessory_condition",
            optionCode: offer.detail.condition,
          },
        ]);
        const previous = current?.variants.find(
          (x) => x.optionSignature === optionSignature,
        );
        const values = {
          sku: offer.sku,
          isActive: true,
          isDefault: offer.isDefault,
          sortOrder: offer.sortOrder,
          priceTomanOverride: offer.priceTomanOverride,
        };
        const variant = await tx.productVariant.upsert({
          where: {
            productId_optionSignature: {
              productId: product.id,
              optionSignature,
            },
          },
          create: {
            productId: product.id,
            optionSignature,
            ...values,
            options: { create: options },
          },
          update: values,
        });
        await tx.laptopAccessoryOfferDetail.upsert({
          where: { variantId: variant.id },
          create: { variantId: variant.id, ...offer.detail },
          update: offer.detail,
        });
        const inventory = previous?.inventory;
        if (!inventory)
          await initializeProductInventoryInTransaction(tx, {
            variantId: variant.id,
            stock: offer.stock,
            adminId,
          });
        else if (inventory.stock !== offer.stock)
          await adjustProductInventoryStockInTransaction(tx, {
            inventoryId: inventory.id,
            delta: offer.stock - inventory.stock,
            idempotencyKey: `accessory-adjust:${randomUUID()}`,
            reason: "ویرایش موجودی قطعه",
            adminId,
          });
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { isActive: offer.isActive },
        });
        await tx.productVariantImage.deleteMany({
          where: { variantId: variant.id },
        });
        if (offer.images.length)
          await tx.productVariantImage.createMany({
            data: offer.images.map((x) => ({ ...x, variantId: variant.id })),
          });
      }
      await tx.product.update({
        where: { id: product.id },
        data: { status: data.product.status },
      });
      return tx.product.findUnique({
        where: { id: product.id },
        include: accessoryInclude,
      });
    },
    { timeout: 30000 },
  );
}
