import { writeAccessory } from "@/lib/laptopAccessoryApi";
import { prisma } from "@/lib/prisma";
import { accessoryInclude } from "@/lib/laptopAccessoryService";
import { authorizeAdminApiRequest } from "@/lib/adminApiAuth";
import { ADMIN_PERMISSIONS } from "@/lib/adminPermissions";
import { NextResponse } from "next/server";
export async function GET(request, { params }) {
  const { response } = await authorizeAdminApiRequest(
    request,
    ADMIN_PERMISSIONS.LAPTOP_ACCESSORIES_VIEW,
  );
  if (response) return response;
  const row = await prisma.product.findFirst({
    where: { id: (await params).id, accessoryProfile: { isNot: null } },
    include: accessoryInclude,
  });
  return row
    ? NextResponse.json(row)
    : NextResponse.json({ error: "قطعه پیدا نشد." }, { status: 404 });
}
export async function PATCH(request, { params }) {
  return writeAccessory(request, (await params).id);
}
