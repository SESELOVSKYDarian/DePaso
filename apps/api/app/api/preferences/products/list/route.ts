import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toProductPreferenceResponse } from "@/lib/preferences";
import { postAsQuery } from "@/lib/http/postAdapter";

/** Preferencias de producto (Fase 10, sección 87 — consumidas por `@depaso/optimization`). */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const prefs = await prisma.productPreference.findMany({
    where: { userId: current.userId },
    include: { product: { select: { name: true } } },
  });

  return NextResponse.json({ preferences: prefs.map(toProductPreferenceResponse) });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postAsQuery(handle);
