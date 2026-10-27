import { Prisma, prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { normalizeName } from "@/lib/merchant";
import { postAsQuery } from "@/lib/http/postAdapter";

const MAX_RESULTS = 30;

/**
 * `GET /api/merchant/claimable-branches?q=` - sucursales que ya están en DePaso (importadas de
 * SEPA o cargadas por un admin) y todavía no tienen comercio a cargo. Un supermercado las busca
 * por nombre o dirección y pide administrarla en vez de cargarse de cero.
 */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const words = normalizeName(request.nextUrl.searchParams.get("q") ?? "")
    .split(" ")
    .filter((word) => word.length > 0);

  const where: Prisma.StoreBranchWhereInput = {
    status: "ACTIVE",
    ownerUserId: null,
    AND: words.map((word) => ({
      OR: [
        { name: { contains: word, mode: "insensitive" as const } },
        { address: { contains: word, mode: "insensitive" as const } },
        { store: { name: { contains: word, mode: "insensitive" as const } } },
      ],
    })),
  };

  const branches = await prisma.storeBranch.findMany({
    where,
    include: { store: { select: { name: true } }, _count: { select: { prices: true } } },
    orderBy: [{ store: { name: "asc" } }, { name: "asc" }],
    take: MAX_RESULTS,
  });

  return NextResponse.json({
    branches: branches.map((branch) => ({
      id: branch.id,
      storeName: branch.store.name,
      name: branch.name,
      address: branch.address,
      latitude: branch.latitude,
      longitude: branch.longitude,
      priceCount: branch._count.prices,
    })),
  });
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
