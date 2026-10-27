import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toPlaceResponse } from "@/lib/places";
import { postAsQuery } from "@/lib/http/postAdapter";

/**
 * Lugares guardados (sección 6/32 del master prompt). `userId` sale siempre de la sesión
 * (`getCurrentUser`), nunca del body — un usuario no puede leer ni crear lugares de otro
 * aunque lo intente mandar en el payload (sección 81).
 */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const places = await prisma.userPlace.findMany({
    where: { userId: current.userId },
    orderBy: [{ isFavorite: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ places: places.map(toPlaceResponse) });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postAsQuery(handle);
