export const PRODUCT_NAME_MAX_LENGTH = 240;

const PRODUCT_NAME_FIELDS = Object.freeze([
  ['nameFa', 'نام فارسی محصول'],
  ['nameEn', 'نام انگلیسی / نام اصلی محصول'],
]);

export function validateProductNames(body, { partial = false } = {}) {
  const data = {};
  for (const [field, label] of PRODUCT_NAME_FIELDS) {
    if (partial && !Object.hasOwn(body, field)) continue;
    if (typeof body[field] !== 'string') {
      return { error: `${label} الزامی و حداکثر ۲۴۰ کاراکتر است.` };
    }
    const value = body[field].trim();
    if (!value || value.length > PRODUCT_NAME_MAX_LENGTH) {
      return { error: `${label} الزامی و حداکثر ۲۴۰ کاراکتر است.` };
    }
    data[field] = value;
  }
  return { data };
}

export function productNameApiFields(product) {
  return {
    name: product.nameFa,
    nameFa: product.nameFa,
    nameEn: product.nameEn,
  };
}
