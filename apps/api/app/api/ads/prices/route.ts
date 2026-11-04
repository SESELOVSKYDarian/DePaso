import { NextRequest, NextResponse } from "next/server";
import { loadAdPrices } from "@/lib/ads/prices";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { postAsQuery } from "@/lib/http/postAdapter";

export const dynamic = "force-dynamic";

/** `POST /api/ads/prices` — el precio base por día de cada formato de publicidad. */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json(await loadAdPrices());
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
