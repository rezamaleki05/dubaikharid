import {
  ACCESSORY_CATEGORIES,
  ACCESSORY_SPECS,
  ACCESSORY_AUTHENTICITY,
  ACCESSORY_CONDITION,
} from "./laptopAccessoryDomain.js";
export const accessoryCategoryId = (slug) => `laptop-accessory-${slug}`;
export const accessorySpecCode = (code) => `accessory_spec_${code}`;
export async function configureAccessoryCatalog(tx, { dryRun = true } = {}) {
  const plan = {
    categories: Object.keys(ACCESSORY_CATEGORIES),
    attributes: [
      "accessory_authenticity",
      "accessory_condition",
      ...new Set(Object.values(ACCESSORY_SPECS).flat().map(accessorySpecCode)),
    ],
    dryRun,
  };
  if (dryRun) return plan;
  for (const [code, labels] of [
    ["accessory_authenticity", ACCESSORY_AUTHENTICITY],
    ["accessory_condition", ACCESSORY_CONDITION],
  ]) {
    // Code uniqueness reuses exact equivalent system attributes; conflicts are never silently renamed.
    const attribute = await tx.catalogAttribute.upsert({
      where: { code },
      create: {
        code,
        nameFa: code === "accessory_authenticity" ? "نوع قطعه" : "وضعیت",
        nameEn: code,
        inputType: "SELECT",
      },
      update: {},
    });
    if (attribute.inputType !== "SELECT" || !attribute.isActive)
      throw Error(`Incompatible system attribute: ${code}`);
    for (const [optionCode, labelFa] of Object.entries(labels))
      await tx.attributeOption.upsert({
        where: {
          attributeId_code: { attributeId: attribute.id, code: optionCode },
        },
        create: {
          attributeId: attribute.id,
          code: optionCode,
          labelFa,
          labelEn: optionCode,
        },
        update: {},
      });
  }
  for (const [slug, name] of Object.entries(ACCESSORY_CATEGORIES)) {
    const id = accessoryCategoryId(slug);
    const candidates = await tx.category.findMany({
      where: {
        OR: [{ id }, { query: `laptop-accessories/${slug}` }, { name }],
      },
    });
    if (candidates.some((x) => x.id !== id))
      throw Error(
        `Existing equivalent category requires explicit mapping: ${slug}`,
      );
    await tx.category.upsert({
      where: { id },
      create: { id, name, query: `laptop-accessories/${slug}` },
      update: {},
    });
    for (const code of [
      "accessory_authenticity",
      "accessory_condition",
      ...ACCESSORY_SPECS[slug].map(accessorySpecCode),
    ]) {
      const isVariantDefining = [
        "accessory_authenticity",
        "accessory_condition",
      ].includes(code);
      const attribute = await tx.catalogAttribute.upsert({
        where: { code },
        create: {
          code,
          nameFa: code.replace("accessory_spec_", ""),
          nameEn: code,
          inputType: "TEXT",
        },
        update: {},
      });
      await tx.categoryAttribute.upsert({
        where: {
          categoryId_attributeId: { categoryId: id, attributeId: attribute.id },
        },
        create: {
          categoryId: id,
          attributeId: attribute.id,
          isVariantDefining,
          isRequired: isVariantDefining,
        },
        update: {},
      });
    }
  }
  await tx.setting.upsert({
    where: { key: "telegramAutoPublishLaptopAccessories" },
    create: { key: "telegramAutoPublishLaptopAccessories", value: "false" },
    update: {},
  });
  return plan;
}
