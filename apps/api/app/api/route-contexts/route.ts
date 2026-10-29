import { prisma } from "@depaso/database";
import { routeContextInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { routeContextInclude, toRouteContextResponse } from "@/lib/user/routeContexts";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = routeContextInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { name, stops } = parsed.data;
  // Los ids de lugares sólo valen si son del usuario (sección 81); se descartan los ajenos.
  const claimedIds = [...new Set([...parsed.data.waypointPlaceIds, ...(stops?.map((stop) => stop.placeId).filter((id): id is string => Boolean(id)) ?? [])])];
  const owned = await prisma.userPlace.findMany({ where: { id: { in: claimedIds }, userId: current.userId } });
  const ownedById = new Map(owned.map((place) => [place.id, place]));
  if (parsed.data.waypointPlaceIds.some((id) => !ownedById.has(id))) {
    return NextResponse.json({ error: "INVALID_PLACE_IDS" }, { status: 400 });
  }

  // Rutas con sólo ids de lugares: las paradas se arman con los datos del lugar guardado.
  const rows = stops
    ? stops.map((stop) => ({ ...stop, placeId: stop.placeId && ownedById.has(stop.placeId) ? stop.placeId : null }))
    : parsed.data.waypointPlaceIds.map((id) => {
        const place = ownedById.get(id)!;
        return { name: place.name, address: place.address, latitude: place.latitude, longitude: place.longitude, emoji: "📍", placeId: id };
      });

  const context = await prisma.savedRouteContext.create({
    data: {
      userId: current.userId,
      name,
      stops: { create: rows.map((row, position) => ({ position, ...row })) },
    },
    include: routeContextInclude,
  });

  return NextResponse.json(toRouteContextResponse(context), { status: 201 });
}

async function handleDelete(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const { count } = await prisma.savedRouteContext.deleteMany({
    where: { id, userId: current.userId },
  });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// DELETE: los datos (incluido el id) llegan en el body JSON.
export const DELETE = postWithParams(["id"], handleDelete);
