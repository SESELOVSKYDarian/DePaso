import { prisma } from "@depaso/database";
import { userPlaceInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toPlaceResponse } from "@/lib/user/places";

/** POST /api/places — guarda un lugar del usuario (casa, trabajo, otro). */
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
