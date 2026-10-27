import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toAdminMerchantRequestResponse } from "@/lib/merchant";
import { postAsQuery } from "@/lib/http/postAdapter";

/** Bandeja del admin. `?status=` filtra (por defecto PENDING); `pendingCount` alimenta el badge. */
async function handle(request: NextRequest) {
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

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
