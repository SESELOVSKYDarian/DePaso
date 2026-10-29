import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toStorePreferenceResponse } from "@/lib/user/preferences";
import { postAsQuery } from "@/lib/http/postAdapter";

const include = { storeBranch: { include: { store: true } } } as const;

/** Preferencias de comercio por categoría (Fase 10, sección 87). */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const prefs = await prisma.storePreference.findMany({
    where: { userId: current.userId },
    include,
  });

  return NextResponse.json({ preferences: prefs.map(toStorePreferenceResponse) });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postAsQuery(handle);
