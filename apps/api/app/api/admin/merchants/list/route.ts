import { prisma } from "@depaso/database";
import { adminMerchantsQuerySchema, type AdminMerchant } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

/** `POST /api/admin/merchants/list` — todos los comercios de la app, con su estado y su publicidad. */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = adminMerchantsQuerySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  const query = parsed.data.query;

  const now = new Date();
  const branches = await prisma.storeBranch.findMany({
    where: {
      ownerUserId: { not: null },
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { address: { contains: query } },
              { store: { name: { contains: query } } },
              { owner: { email: { contains: query } } },
              { owner: { displayName: { contains: query } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { store: { select: { name: true } }, owner: { select: { id: true, displayName: true, email: true } } },
  });

  const ownerIds = branches.flatMap((branch: (typeof branches)[number]) => (branch.ownerUserId ? [branch.ownerUserId] : []));
  const ads = await prisma.adRequest.findMany({
    where: {
      userId: { in: ownerIds },
      OR: [{ status: { in: ["PENDING", "COUNTER"] } }, { status: "APPROVED", startsAt: { lte: now }, endsAt: { gte: now } }],
    },
    select: { id: true, userId: true, kind: true, title: true, status: true, endsAt: true },
  });

  const merchants: AdminMerchant[] = branches.map((branch: (typeof branches)[number]) => {
    const own = ads.filter((ad: (typeof ads)[number]) => ad.userId === branch.ownerUserId);
    return {
      branchId: branch.id,
      storeName: branch.store.name,
      branchName: branch.name,
      address: branch.address,
      ownerName: branch.owner?.displayName ?? null,
      ownerEmail: branch.owner?.email ?? "",
      enabled: branch.status === "ACTIVE",
      activeAds: own
        .filter((ad: (typeof own)[number]) => ad.status === "APPROVED" && ad.endsAt)
        .map((ad: (typeof own)[number]) => ({ id: ad.id, kind: ad.kind, title: ad.title, endsAt: ad.endsAt!.toISOString() })),
      pendingAds: own.filter((ad: (typeof own)[number]) => ad.status !== "APPROVED").length,
    };
  });
  return NextResponse.json({ merchants });
}
