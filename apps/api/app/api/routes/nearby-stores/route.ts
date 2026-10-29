import { prisma } from "@depaso/database";
import { nearbyStoresRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { boundingBox, decodePolyline, findStoresAlongRoute, type LatLng } from "@/lib/routes/nearbyStores";

/**
 * `POST /api/routes/nearby-stores` - los comercios que te quedan "de paso" sobre el recorrido
 * de hoy, ordenados por cuánto hay que desviarse para pasar por cada uno. Alimenta los pines
 * del mapa.
 */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = nearbyStoresRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { waypoints, polyline, maxDetourMeters, limit } = parsed.data;

  // Con la polyline real el desvío sale de las calles de verdad; sin ella, de los waypoints.
  const decoded: LatLng[] = polyline ? decodePolyline(polyline) : [];
  const path = decoded.length >= 2 ? decoded : waypoints;

  // Un comercio a más de `maxDetour / 2` del camino ya no entra: se filtra en la base.
  const box = boundingBox(path, maxDetourMeters);
  const branches = await prisma.storeBranch.findMany({
    where: {
      status: "ACTIVE",
      latitude: { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
    },
    include: { store: { select: { name: true } } },
    take: 800,
  });

  const nearby = findStoresAlongRoute(
    path,
    branches.map((branch) => ({
      branchId: branch.id,
      storeName: branch.store.name,
      branchName: branch.name,
      address: branch.address,
      latitude: branch.latitude,
      longitude: branch.longitude,
    })),
    maxDetourMeters,
  ).slice(0, limit);

  return NextResponse.json({ stores: nearby });
}
