import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { buildHomeFeed } from "@/lib/home/homeFeed";
import { postAsQuery } from "@/lib/http/postAdapter";

export const dynamic = "force-dynamic";

/** Novedades de Inicio para el usuario de la sesión: cambios de precio de sus listas y promos de hoy. */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    return NextResponse.json(await buildHomeFeed(current.userId));
  } catch (error) {
    console.error("Falló el feed de Inicio:", error);
    return NextResponse.json({ error: "FEED_FAILED" }, { status: 502 });
  }
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
