import "server-only";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission, ADMIN_PERMISSIONS } from "@/lib/adminPermissions";
// Generic Product/inventory APIs cannot circumvent the specialized offer writer.
export async function accessoryAdminBoundary(request, admin) {
  if (!request?.url) return null;
  const path = new URL(request.url).pathname;
  if (
    !/^\/api\/admin\/(products|product-variants|inventory|product-inventory)(?:\/|$)/.test(
      path,
    )
  )
    return null;
  const productIds = new Set(),
    variantIds = new Set(),
    inventoryIds = new Set();
  const match =
    /^\/api\/admin\/(products|product-variants|inventory|product-inventory)\/([^/]+)/.exec(
      path,
    );
  if (match) {
    const id = decodeURIComponent(match[2]);
    if (
      ![
        "upload",
        "configuration",
        "reserve",
        "release-expired",
        "reservations",
      ].includes(id)
    ) {
      if (match[1] === "products") productIds.add(id);
      else if (["product-variants", "inventory"].includes(match[1]))
        variantIds.add(id);
      else inventoryIds.add(id);
    }
  }
  if (!["GET", "HEAD"].includes(request.method)) {
    let body;
    try {
      body = await request.clone().json();
    } catch {
      body = null;
    }
    for (const row of [
      body,
      ...(Array.isArray(body?.lines) ? body.lines : []),
    ].filter(Boolean)) {
      if (typeof row.productId === "string") productIds.add(row.productId);
      if (typeof (row.variantId || row.productVariantId) === "string")
        variantIds.add(row.variantId || row.productVariantId);
      if (typeof row.inventoryId === "string")
        inventoryIds.add(row.inventoryId);
    }
  }
  if (!productIds.size && !variantIds.size && !inventoryIds.size) return null;
  const accessory = await prisma.product.findFirst({
    where: {
      accessoryProfile: { isNot: null },
      OR: [
        { id: { in: [...productIds] } },
        {
          variants: {
            some: {
              OR: [
                { id: { in: [...variantIds] } },
                { inventory: { is: { id: { in: [...inventoryIds] } } } },
              ],
            },
          },
        },
      ],
    },
    select: { id: true },
  });
  if (!accessory) return null;
  if (!hasPermission(admin, ADMIN_PERMISSIONS.LAPTOP_ACCESSORIES_VIEW))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!["GET", "HEAD"].includes(request.method))
    return NextResponse.json(
      { error: "قطعات لپ تاپ را از بخش اختصاصی مدیریت کنید." },
      { status: 409 },
    );
  return null;
}
