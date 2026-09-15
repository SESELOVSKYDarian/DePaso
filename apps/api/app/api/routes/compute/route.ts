import { routeComputeRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getRouteProvider } from "@/lib/routing";

/**
 * Ruteo real para dibujar el mapa del recorrido de hoy (Fase 17) — nunca calcula del lado
 * del cliente para no exponer decisiones de ruteo a manipulación y para no requerir el
 * token de Mapbox en el bundle de `apps/mobile`. Sin `MAPBOX_ACCESS_TOKEN` configurado,
 * responde igual con `MockRouteProvider` (distancia en línea recta, sin `polyline`) — no
 * rompe el mapa, sólo no dibuja una calle real.
 */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = routeComputeRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const provider = getRouteProvider(parsed.data.transportMode);
    const result = await provider.computeRoute(parsed.data.waypoints, parsed.data.transportMode);
    return NextResponse.json({
      distanceMeters: result.distanceMeters,
      durationSeconds: result.durationSeconds,
      polyline: result.polyline,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "ROUTE_COMPUTE_FAILED", message: error instanceof Error ? error.message : "unknown" },
      { status: 422 }
    );
  }
}
