import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { requireMerchant } from "@/lib/auth/requireMerchant";

/** Sucursal propia del comercio autenticado. */
export async function GET(request: NextRequest) {
  const merchant = await requireMerchant(request);
  if (!merchant) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const branch = await prisma.storeBranch.findUnique({
    where: { id: merchant.branchId },
    include: { store: true },
  });
  if (!branch) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({
    branch: {
      id: branch.id,
      storeName: branch.store.name,
      name: branch.name,
      address: branch.address,
      latitude: branch.latitude,
      longitude: branch.longitude,
    },
  });
}
