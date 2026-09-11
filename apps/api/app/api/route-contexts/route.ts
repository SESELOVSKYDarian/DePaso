import { prisma } from "@depaso/database";
import { routeContextInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toRouteContextResponse } from "@/lib/routeContexts";

/**
 * Contextos de ruta guardados (sección 34: "Guardado hasta que el usuario lo borre").
 * `waypointPlaceIds` sólo puede referenciar `UserPlace` del usuario actual — se valida
 * contra la DB, nunca se confía en que el id mandado sea realmente suyo (sección 81).
 */
export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const contexts = await prisma.savedRouteContext.findMany({
    where: { userId: current.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ routeContexts: contexts.map(toRouteContextResponse) });
}

export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = routeContextInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { name, waypointPlaceIds } = parsed.data;

  const ownedCount = await prisma.userPlace.count({
    where: { id: { in: waypointPlaceIds }, userId: current.userId },
  });
  if (ownedCount !== waypointPlaceIds.length) {
    return NextResponse.json({ error: "INVALID_PLACE_IDS" }, { status: 400 });
  }

  const context = await prisma.savedRouteContext.create({
    data: { userId: current.userId, name, waypointPlaceIds },
  });

  return NextResponse.json(toRouteContextResponse(context), { status: 201 });
}
