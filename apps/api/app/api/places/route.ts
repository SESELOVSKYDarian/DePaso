import { prisma } from "@depaso/database";
import { userPlaceInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toPlaceResponse } from "@/lib/places";

/**
 * Lugares guardados (sección 6/32 del master prompt). `userId` sale siempre de la sesión
 * (`getCurrentUser`), nunca del body — un usuario no puede leer ni crear lugares de otro
 * aunque lo intente mandar en el payload (sección 81).
 */
export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const places = await prisma.userPlace.findMany({
    where: { userId: current.userId },
    orderBy: [{ isFavorite: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ places: places.map(toPlaceResponse) });
}

export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = userPlaceInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const place = await prisma.userPlace.create({
    data: { ...parsed.data, userId: current.userId },
  });

  return NextResponse.json(toPlaceResponse(place), { status: 201 });
}
