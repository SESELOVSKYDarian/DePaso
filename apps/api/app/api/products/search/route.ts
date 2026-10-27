import { productSearchQuerySchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { searchProducts } from "@/lib/products";
import { postAsQuery } from "@/lib/http/postAdapter";

/**
 * Búsqueda de catálogo (Fase 8, sección 37) - `GET /api/products/search?q=...&type=...&brandId=...`.
 * `type` y `brandId` son filtros opcionales; alcanza con uno de los tres criterios.
 */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const parsed = productSearchQuerySchema.safeParse({
    q: params.get("q") ?? "",
    type: params.get("type") ?? undefined,
    brandId: params.get("brandId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const results = await searchProducts(parsed.data.q, { type: parsed.data.type, brandId: parsed.data.brandId });
  return NextResponse.json({ results });
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
