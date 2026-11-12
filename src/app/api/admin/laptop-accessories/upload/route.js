import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { authorizeAdminApiRequest } from "@/lib/adminApiAuth";
import { ADMIN_PERMISSIONS } from "@/lib/adminPermissions";
import { getProductBlobAuthOptions } from "@/lib/productImageStorage";
import {
  ACCESSORY_IMAGE_MAX_BYTES,
  ACCESSORY_UPLOAD_TYPES,
  accessoryUploadPath,
} from "@/lib/laptopAccessoryUploadDomain";
export const runtime = "nodejs";
export async function POST(request) {
  try {
    const body = await request.json();
    // Completion callbacks are authenticated by the Blob SDK signature, not a browser cookie.
    if (body.type !== "blob.upload-completed") {
      const { response } = await authorizeAdminApiRequest(
        request,
        ADMIN_PERMISSIONS.LAPTOP_ACCESSORIES_EDIT,
      );
      if (response) return response;
    }
    const auth = getProductBlobAuthOptions();
    if (!auth?.token)
      return NextResponse.json(
        { error: "فضای تصویر تنظیم نشده است." },
        { status: 503 },
      );
    const result = await handleUpload({
      body,
      request,
      ...auth,
      onBeforeGenerateToken: async (pathname) => {
        if (!accessoryUploadPath(pathname))
          throw Error("مسیر آپلود معتبر نیست.");
        return {
          allowedContentTypes: ACCESSORY_UPLOAD_TYPES,
          maximumSizeInBytes: ACCESSORY_IMAGE_MAX_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "آپلود امن انجام نشد." },
      { status: 400 },
    );
  }
}
