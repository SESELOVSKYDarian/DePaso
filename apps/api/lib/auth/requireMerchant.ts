import type { NextRequest } from "next/server";
import { prisma } from "@depaso/database";
import { getCurrentUser } from "./currentUser";

export interface CurrentMerchant {
  userId: string;
  branchId: string;
}

/** Sólo cuentas con `role === "MERCHANT"` que además tengan una sucursal propia asignada. */
export async function requireMerchant(request: NextRequest): Promise<CurrentMerchant | null> {
  const current = await getCurrentUser(request);
  if (!current) return null;

  const user = await prisma.user.findUnique({
    where: { id: current.userId },
    include: { ownedBranches: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (!user || user.deletedAt || user.role !== "MERCHANT") return null;

  const branch = user.ownedBranches[0];
  if (!branch) return null;

  return { userId: user.id, branchId: branch.id };
}
