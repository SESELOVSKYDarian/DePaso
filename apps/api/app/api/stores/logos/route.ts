import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { postAsQuery } from "@/lib/http/postAdapter";
import { loadBrandLogos } from "@/lib/stores/brandLogos";

export const dynamic = "force-dynamic";

/** Logos de las cadenas (Coto, Carrefour, Shell…), leídos de la base de datos. */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    return NextResponse.json(await loadBrandLogos());
  } catch (error) {
    console.error("Falló la carga de logos:", error);
    return NextResponse.json({ error: "LOGOS_FAILED" }, { status: 502 });
  }
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
