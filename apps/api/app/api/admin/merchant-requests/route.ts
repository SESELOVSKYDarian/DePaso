import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toAdminMerchantRequestResponse } from "@/lib/merchant";

/** Bandeja del admin. `?status=` filtra (por defecto PENDING); `pendingCount` alimenta el badge. */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const raw = request.nextUrl.searchParams.get("status") ?? "PENDING";
  const status = raw === "APPROVED" || raw === "REJECTED" || raw === "PENDING" ? raw : "PENDING";

  const [requests, pendingCount] = await Promise.all([
    prisma.merchantRequest.findMany({
      where: { status },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.merchantRequest.count({ where: { status: "PENDING" } }),
  ]);

  return NextResponse.json({
    requests: requests.map(toAdminMerchantRequestResponse),
    pendingCount,
  });
}
