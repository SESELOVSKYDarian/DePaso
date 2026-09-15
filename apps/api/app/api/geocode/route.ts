import { geocodeRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getGeocodingProvider } from "@/lib/geocoding";

/** Geocodificación real (Fase 28) — `POST /api/geocode`. Ver docs/development/GEOCODING-SETUP.md. */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const provider = getGeocodingProvider();
  if (!provider) {
    return NextResponse.json({ error: "GEOCODING_NOT_CONFIGURED" }, { status: 503 });
  }

  const json = await request.json().catch(() => null);
  const parsed = geocodeRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await provider.geocode(parsed.data.address);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "ADDRESS_NOT_FOUND" }, { status: 404 });
  }
}
