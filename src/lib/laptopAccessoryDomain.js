export const ACCESSORY_AUTHENTICITY = Object.freeze({
  ORIGINAL: "اصلی",
  OEM: "OEM",
  COMPATIBLE: "سازگار / غیر اصلی",
  AFTERMARKET: "Aftermarket / غیر اصلی",
});
export const ACCESSORY_CONDITION = Object.freeze({
  NEW: "نو",
  USED: "دست دوم",
});
export const ACCESSORY_SPEC_LABELS = Object.freeze({
  part_number: "شماره قطعه", capacity_wh: "ظرفیت (Wh)",
  capacity_mah: "ظرفیت (mAh)", voltage: "ولتاژ (V)", cell_count: "تعداد سلول",
  chemistry: "نوع شیمی باتری", connector: "نوع اتصال", capacity: "ظرفیت",
  ddr: "نسل DDR", speed_mhz: "سرعت (MHz)", form_factor: "فرم‌فکتور",
  ecc: "ECC", rank: "Rank", interface: "رابط", pcie_generation: "نسل PCIe",
  read_speed: "سرعت خواندن", write_speed: "سرعت نوشتن", rpm: "دور در دقیقه (RPM)",
  wattage: "توان (W)", output_amp: "جریان خروجی (A)", cable_included: "کابل همراه",
  model: "مدل", hdmi: "HDMI", displayport: "DisplayPort", usb_ports: "درگاه‌های USB",
  ethernet: "شبکه Ethernet", power_delivery: "توان Power Delivery",
  charger_included: "شارژر همراه", layout: "چیدمان کیبورد", notes: "یادداشت فنی",
});
export const ACCESSORY_CATEGORIES = Object.freeze({
  battery: "باتری لپ تاپ",
  ram: "RAM لپ تاپ",
  ssd: "SSD لپ تاپ",
  hdd: "HDD لپ تاپ",
  charger: "شارژر لپ تاپ",
  dock: "Dock / Docking Station",
  keyboard: "کیبورد / قطعات جانبی",
  other: "سایر قطعات لپ تاپ",
});
export const ACCESSORY_SPECS = Object.freeze({
  battery: [
    "part_number",
    "capacity_wh",
    "capacity_mah",
    "voltage",
    "cell_count",
    "chemistry",
    "connector",
  ],
  ram: [
    "part_number",
    "capacity",
    "ddr",
    "speed_mhz",
    "form_factor",
    "ecc",
    "rank",
    "voltage",
  ],
  ssd: [
    "part_number",
    "capacity",
    "interface",
    "form_factor",
    "pcie_generation",
    "read_speed",
    "write_speed",
  ],
  hdd: ["part_number", "capacity", "form_factor", "interface", "rpm"],
  charger: ["wattage", "voltage", "output_amp", "connector", "cable_included"],
  dock: [
    "model",
    "interface",
    "hdmi",
    "displayport",
    "usb_ports",
    "ethernet",
    "power_delivery",
    "charger_included",
  ],
  keyboard: ["part_number", "layout"],
  other: ["part_number", "notes"],
});
export class AccessoryError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const fail = (message) => {
  throw new AccessoryError(message);
};
function text(value, max = 200, required = false) {
  if (value == null || value === "") {
    if (required) fail("فیلد الزامی خالی است.");
    return null;
  }
  if (
    typeof value !== "string" ||
    value.trim().length > max ||
    (required && !value.trim())
  )
    fail("متن نامعتبر است.");
  return value.trim() || null;
}
function integer(value, max = 1_000_000_000, optional = false) {
  if (optional && (value == null || value === "")) return null;
  if (
    value === "" ||
    value == null ||
    !/^\d+$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > max
  )
    fail("عدد صحیح نامنفی لازم است.");
  return Number(value);
}
export function accessoryImages(input = []) {
  if (!Array.isArray(input) || input.length > 30)
    fail("حداکثر ۳۰ تصویر مجاز است.");
  const seen = new Set();
  const rows = input.map((item, sortOrder) => {
    let u;
    try {
      u = new URL(item.url);
    } catch {
      fail("نشانی تصویر نامعتبر است.");
    }
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      u.search ||
      u.hash ||
      !/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(u.hostname) ||
      !/^\/laptop-accessories\/\d{4}\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(
        u.pathname,
      )
    )
      fail("تصویر باید از آپلود امن لوازم لپ تاپ باشد.");
    if (seen.has(u.href)) fail("تصویر تکراری است.");
    seen.add(u.href);
    return {
      url: u.href,
      blobPathname: u.pathname.slice(1),
      sortOrder,
      isPrimary: item.isPrimary === true,
      altFa: text(item.altFa, 240),
      altEn: text(item.altEn, 240),
    };
  });
  if (rows.filter((x) => x.isPrimary).length > 1)
    fail("فقط یک تصویر شاخص مجاز است.");
  if (rows.length && !rows.some((x) => x.isPrimary)) rows[0].isPrimary = true;
  return rows;
}
export function validateAccessory(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    fail("اطلاعات نامعتبر است.");
  const categorySlug = text(input.categorySlug, 80, true);
  if (!Object.hasOwn(ACCESSORY_CATEGORIES, categorySlug))
    fail("دسته‌بندی لوازم نامعتبر است.");
  const slug = text(input.slug, 120, true);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    fail("Slug باید انگلیسی و خط تیره باشد.");
  const compatibility = input.compatibility || [];
  if (
    !Array.isArray(compatibility) ||
    compatibility.length > 200 ||
    compatibility.some((x) => typeof x !== "string" || !x || x.length > 100) ||
    new Set(compatibility).size !== compatibility.length
  )
    fail("مدل سازگار تکراری یا نامعتبر است.");
  if (!Array.isArray(input.offers) || input.offers.length > 8)
    fail("حالت‌های فروش نامعتبر است.");
  const seen = new Set(),
    skus = new Set();
  const offers = input.offers.map((offer, sortOrder) => {
    const { authenticity, condition } = offer;
    if (
      !Object.hasOwn(ACCESSORY_AUTHENTICITY, authenticity) ||
      !Object.hasOwn(ACCESSORY_CONDITION, condition)
    )
      fail("اصالت یا وضعیت نامعتبر است.");
    const key = `${authenticity}:${condition}`;
    if (seen.has(key)) fail("حالت فروش تکراری است.");
    seen.add(key);
    const rawSku = text(offer.sku, 80);
    const sku = rawSku?.toUpperCase() || null;
    if (sku && !/^[A-Z0-9][A-Z0-9._/-]{0,79}$/.test(sku))
      fail("SKU معتبر نیست.");
    if (sku && skus.has(sku)) fail("SKU تکراری است.");
    if (sku) skus.add(sku);
    const detail = {
      authenticity,
      condition,
      warrantyDays: integer(offer.warrantyDays, 36500, true),
      offerNotes: text(offer.offerNotes, 2000),
      manufactureDate: null,
    };
    if (offer.manufactureDate) {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(offer.manufactureDate) ||
        Number.isNaN(Date.parse(offer.manufactureDate)) ||
        new Date(offer.manufactureDate).toISOString().slice(0, 10) !==
          offer.manufactureDate
      )
        fail("تاریخ ساخت نامعتبر است.");
      detail.manufactureDate = new Date(offer.manufactureDate);
    }
    for (const k of [
      "healthPercent",
      "cycleCount",
      "powerOnHours",
      "grade",
      "smartStatus",
      "tested",
      "testNotes",
    ])
      detail[k] = null;
    if (condition === "USED") {
      detail.grade = text(offer.grade, 30);
      detail.testNotes = text(offer.testNotes, 2000);
      if (offer.tested != null && typeof offer.tested !== "boolean")
        fail("وضعیت تست نامعتبر است.");
      detail.tested = offer.tested ?? null;
      if (["battery", "ssd", "hdd"].includes(categorySlug))
        detail.healthPercent = integer(offer.healthPercent, 100, true);
      if (categorySlug === "battery")
        detail.cycleCount = integer(offer.cycleCount, 1_000_000, true);
      if (["ssd", "hdd"].includes(categorySlug)) {
        detail.powerOnHours = integer(offer.powerOnHours, 1_000_000, true);
        detail.smartStatus = text(offer.smartStatus, 100);
      }
    }
    if (offer.isActive != null && typeof offer.isActive !== "boolean")
      fail("وضعیت فعال نامعتبر است.");
    return {
      key,
      sku,
      sortOrder,
      isDefault: offer.isDefault === true,
      isActive: offer.isActive === true,
      priceTomanOverride:
        offer.isActive || (offer.price != null && offer.price !== "")
          ? String(integer(offer.price, 999_999_999_999))
          : null,
      stock: integer(offer.stock),
      detail,
      images: accessoryImages(offer.images),
    };
  });
  if (offers.filter((x) => x.isDefault).length > 1)
    fail("فقط یک پیش‌فرض مجاز است.");
  if (
    input.published === true &&
    !offers.some((x) => x.isActive && Number(x.priceTomanOverride) > 0)
  )
    fail("انتشار به حالت فعال با قیمت معتبر نیاز دارد.");
  if (offers.some((x) => x.isActive && Number(x.priceTomanOverride) <= 0))
    fail("قیمت حالت فعال باید مثبت باشد.");
  const specs = input.specs || {};
  if (
    typeof specs !== "object" ||
    Array.isArray(specs) ||
    Object.keys(specs).some((k) => !ACCESSORY_SPECS[categorySlug].includes(k))
  )
    fail("مشخصات این دسته نامعتبر است.");
  return {
    product: {
      nameFa: text(input.nameFa, 240, true),
      nameEn: text(input.nameEn, 240, true),
      slug,
      brandId: text(input.brandId, 100, true),
      description: text(input.description, 20000),
      status: input.published === true ? "active" : "hidden",
    },
    profile: {
      categorySlug,
      partNumber: text(input.partNumber, 120),
      modelNumber: text(input.modelNumber, 120),
      shortTechnicalName: text(input.shortTechnicalName, 300),
      compatibilityNotes: text(input.compatibilityNotes, 2000),
      seoTitle: text(input.seoTitle, 200),
      seoDescription: text(input.seoDescription, 320),
      isFeatured: input.isFeatured === true,
    },
    compatibility,
    specs: Object.fromEntries(
      Object.entries(specs).map(([k, v]) => [k, text(v, 1000)]),
    ),
    offers,
    images: accessoryImages(input.images),
  };
}
export function chooseAccessoryOffer(offers = []) {
  const active = offers.filter((x) => x.isActive);
  const inStock = active.filter(
    (x) =>
      Number(x.inventory?.stock || 0) - Number(x.inventory?.reserved || 0) > 0,
  );
  return inStock.find((x) => x.isDefault) || inStock[0] || active[0] || null;
}
export function accessoryGallery(product, offer) {
  return offer?.accessoryImages?.length
    ? offer.accessoryImages
    : product.images || [];
}
export function accessoryCoverImage(product) {
  const shared = product.images || [];
  const images = shared.length ? shared : accessoryGallery(product, chooseAccessoryOffer(product.variants));
  return images.find((image) => image.isPrimary) || images[0] || null;
}
export function accessoryAvailable(offer) {
  return offer?.isActive === true
    ? Math.max(
        0,
        Number(offer.inventory?.stock || 0) -
          Number(offer.inventory?.reserved || 0),
      )
    : 0;
}
