import { placeSearchRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { searchPlaces } from "@/lib/integrations/placeSearch";

// Tope por usuario: el buscador manda una consulta por cada pausa al escribir.
const SEARCH_RATE_LIMIT = { max: 120, windowMs: 60 * 1000 };

/** POST /api/geocode/search — sugerencias de lugares mientras se escribe (comercios, escuelas, calles, barrios). */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  if (!checkRateLimit(`place-search:${current.userId}`, SEARCH_RATE_LIMIT.max, SEARCH_RATE_LIMIT.windowMs)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = placeSearchRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { q, latitude, longitude } = parsed.data;
  const near = latitude !== undefined && longitude !== undefined ? { latitude, longitude } : undefined;

  try {
    const results = await searchPlaces(q, near);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "SEARCH_FAILED" }, { status: 502 });
  }
}
