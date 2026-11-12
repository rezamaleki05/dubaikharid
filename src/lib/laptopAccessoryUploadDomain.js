import { detectProductImageMime } from "./productImageValidation.js";
export const ACCESSORY_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const ACCESSORY_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];
export function accessoryUploadPath(pathname) {
  return (
    typeof pathname === "string" &&
    /^laptop-accessories\/\d{4}\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(pathname)
  );
}
export async function verifyAccessoryBlob(image, fetcher = fetch) {
  // Called only after strict HTTPS public-Blob host/path validation in validateAccessory.
  const head = await fetcher(image.url, {
    method: "HEAD",
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  const length = Number(head.headers.get("content-length"));
  const type = head.headers.get("content-type")?.split(";")[0];
  if (
    !head.ok ||
    !Number.isSafeInteger(length) ||
    length <= 0 ||
    length > ACCESSORY_IMAGE_MAX_BYTES ||
    !ACCESSORY_UPLOAD_TYPES.includes(type)
  )
    throw Error("تصویر آپلودشده معتبر نیست.");
  const response = await fetcher(image.url, {
    headers: { Range: "bytes=0-15" },
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error("تأیید تصویر انجام نشد.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (
    bytes.length > ACCESSORY_IMAGE_MAX_BYTES ||
    detectProductImageMime(bytes) !== type
  )
    throw Error("محتوای تصویر معتبر نیست.");
}
