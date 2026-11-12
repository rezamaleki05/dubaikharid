import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeAdminApiRequest } from "@/lib/adminApiAuth";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";
import { accessoryInclude, saveAccessory } from "@/lib/laptopAccessoryService";
import { AccessoryError } from "@/lib/laptopAccessoryDomain";
import { logAdminActivity } from "@/lib/adminActivity";
import { captureIndexNowState, scheduleIndexNowChange } from "@/lib/indexnow";
import { scheduleTelegramPublication } from "@/lib/telegram/service";
export async function writeAccessory(request, id) {
  const { admin, response } = await authorizeAdminApiRequest(
    request,
    P.LAPTOP_ACCESSORIES_EDIT,
  );
  if (response) return response;
  try {
    const input = await request.json();
    const before = id ? await captureIndexNowState("product", id) : null;
    const row = await saveAccessory(prisma, input, { id, adminId: admin.id });
    await logAdminActivity({
      adminId: admin.id,
      action: id ? "LAPTOP_ACCESSORY_UPDATED" : "LAPTOP_ACCESSORY_CREATED",
      entityType: "Product",
      entityId: row.id,
      metadata: {
        published: row.status === "active",
        activeOffers: row.variants.filter((v) => v.isActive).length,
      },
      request,
    });
    scheduleIndexNowChange(
      before || { kind: "product", id: row.id, pages: {} },
    );
    if (row.status === "active") scheduleTelegramPublication(row.id);
    return NextResponse.json(row, { status: id ? 200 : 201 });
  } catch (e) {
    if (e instanceof SyntaxError)
      return NextResponse.json({ error: "JSON نامعتبر است." }, { status: 400 });
    if (e instanceof AccessoryError || e?.status)
      return NextResponse.json({ error: e.message }, { status: e.status });
    if (e?.code === "P2002")
      return NextResponse.json(
        { error: "Slug یا SKU تکراری است." },
        { status: 409 },
      );
    console.error("ACCESSORY_SAVE_FAILED", e?.code);
    return NextResponse.json({ error: "ثبت قطعه انجام نشد." }, { status: 500 });
  }
}
