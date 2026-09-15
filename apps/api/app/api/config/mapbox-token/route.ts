import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";

/**
 * Token público de Mapbox GL JS para el mapa visual de `apps/mobile` (Fase 17). No es un
 * secreto (los tokens `pk.*` de Mapbox están pensados para viajar al cliente) — se sirve
 * desde acá para no duplicar `MAPBOX_ACCESS_TOKEN` en dos sistemas de config distintos
 * (`.env.local` de `apps/api` y variables `EXPO_PUBLIC_*` de `apps/mobile`).
 */
export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  return NextResponse.json({ token: process.env.MAPBOX_ACCESS_TOKEN ?? null });
}
