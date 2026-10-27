import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toRouteContextResponse } from "@/lib/routeContexts";
import { postAsQuery } from "@/lib/http/postAdapter";

/**
 * Contextos de ruta guardados (sección 34: "Guardado hasta que el usuario lo borre").
 * `waypointPlaceIds` sólo puede referenciar `UserPlace` del usuario actual — se valida
 * contra la DB, nunca se confía en que el id mandado sea realmente suyo (sección 81).
 */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const contexts = await prisma.savedRouteContext.findMany({
    where: { userId: current.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ routeContexts: contexts.map(toRouteContextResponse) });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postAsQuery(handle);
