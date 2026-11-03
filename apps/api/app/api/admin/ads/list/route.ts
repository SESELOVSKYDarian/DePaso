import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { loadProductNames, toAdResponse } from "@/lib/ads/ads";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { postAsQuery } from "@/lib/http/postAdapter";

export const dynamic = "force-dynamic";

/** Todos los pedidos de publicidad, primero los pendientes, con quién los pidió y cuánto ofrece. */
async function handle(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const rows = await prisma.adRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const pendingCount = rows.filter((row: (typeof rows)[number]) => row.status === "PENDING").length;
  rows.sort((a: (typeof rows)[number], b: (typeof rows)[number]) => Number(b.status === "PENDING") - Number(a.status === "PENDING"));

  const userIds = [...new Set(rows.map((row: (typeof rows)[number]) => row.userId))];
  const branchIds = [...new Set(rows.map((row: (typeof rows)[number]) => row.storeBranchId))];
  const [users, branches, productNames] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } }),
    prisma.storeBranch.findMany({ where: { id: { in: branchIds } }, select: { id: true, name: true, store: { select: { name: true } } } }),
    loadProductNames(rows),
  ]);
  const branchByUser = new Map<string, string>();
  for (const row of rows) {
    const branch = branches.find((entry: (typeof branches)[number]) => entry.id === row.storeBranchId);
    if (branch) branchByUser.set(row.userId, branch.store.name);
  }
  const merchants = new Map(
    users.map((user: (typeof users)[number]) => [user.id, { name: branchByUser.get(user.id) ?? null, email: user.email }]),
  );

  return NextResponse.json({ ads: rows.map((row: (typeof rows)[number]) => toAdResponse(row, { productNames, merchants })), pendingCount });
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
