import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { publicProductHref } from "./productUrl";
import { accessoryAvailable } from "./laptopAccessoryDomain";
const imageSelect = {
  id: true,
  url: true,
  sortOrder: true,
  isPrimary: true,
  altFa: true,
  altEn: true,
};
export const PUBLIC_ACCESSORY_SELECT = {
  id: true,
  slug: true,
  nameFa: true,
  nameEn: true,
  description: true,
  image: true,
  updatedAt: true,
  brand: { select: { id: true, name: true, faName: true } },
  accessoryProfile: {
    select: {
      categorySlug: true,
      partNumber: true,
      modelNumber: true,
      shortTechnicalName: true,
      compatibilityNotes: true,
      seoTitle: true,
      seoDescription: true,
      isFeatured: true,
      compatibility: {
        select: {
          laptopModel: {
            select: {
              id: true,
              name: true,
              series: true,
              exactModel: true,
              brand: { select: { name: true } },
            },
          },
        },
      },
    },
  },
  images: { select: imageSelect, orderBy: { sortOrder: "asc" } },
  attributeValues: {
    select: {
      textValue: true,
      numberValue: true,
      categoryAttribute: {
        select: { attribute: { select: { code: true, nameFa: true } } },
      },
    },
  },
  variants: {
    where: { isActive: true },
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      productId: true,
      sku: true,
      isActive: true,
      isDefault: true,
      priceTomanOverride: true,
      inventory: { select: { stock: true, reserved: true } },
      accessoryImages: { select: imageSelect, orderBy: { sortOrder: "asc" } },
      accessoryOffer: {
        select: {
          authenticity: true,
          condition: true,
          grade: true,
          healthPercent: true,
          cycleCount: true,
          powerOnHours: true,
          smartStatus: true,
          tested: true,
          testNotes: true,
          warrantyDays: true,
          manufactureDate: true,
          offerNotes: true,
        },
      },
    },
  },
};
export function serializeAccessory(row) {
  const variants = row.variants
    .filter((x) => x.accessoryOffer)
    .map((v) => ({
      ...v,
      priceTomanOverride: String(v.priceTomanOverride),
      available: accessoryAvailable(v),
    }));
  const available = variants.filter((v) => v.available > 0);
  const prices = (available.length ? available : variants).map((v) =>
    Number(v.priceTomanOverride),
  );
  return JSON.parse(
    JSON.stringify({
      ...row,
      variants,
      publicHref: publicProductHref(row),
      priceFrom: prices.length ? Math.min(...prices) : null,
      priceVaries: new Set(prices).size > 1,
    }),
  );
}
export async function getPublicAccessories({
  category = null,
  laptopModelId = null,
} = {}) {
  const rows = await prisma.product.findMany({
    where: {
      status: "active",
      accessoryProfile: {
        is: {
          ...(category ? { categorySlug: category } : {}),
          ...(laptopModelId
            ? { compatibility: { some: { laptopModelId } } }
            : {}),
        },
      },
      variants: { some: { isActive: true, accessoryOffer: { isNot: null } } },
    },
    select: PUBLIC_ACCESSORY_SELECT,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map(serializeAccessory);
}
export const getPublicAccessory = cache(async (category, slug) => {
  const row = await prisma.product.findFirst({
    where: {
      slug,
      status: "active",
      accessoryProfile: { is: { categorySlug: category } },
      variants: { some: { isActive: true, accessoryOffer: { isNot: null } } },
    },
    select: PUBLIC_ACCESSORY_SELECT,
  });
  return row ? serializeAccessory(row) : null;
});
