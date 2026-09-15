import { reverseGeocodeRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getGeocodingProvider } from "@/lib/geocoding";

/** Geocodificación inversa real (Fase 28) — `POST /api/geocode/reverse`. */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const provider = getGeocodingProvider();
  if (!provider) {
    return NextResponse.json({ error: "GEOCODING_NOT_CONFIGURED" }, { status: 503 });
  }

  const json = await request.json().catch(() => null);
  const parsed = reverseGeocodeRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const address = await provider.reverseGeocode(parsed.data);
    return NextResponse.json({ address });
  } catch {
    return NextResponse.json({ error: "ADDRESS_NOT_FOUND" }, { status: 404 });
  }
}
