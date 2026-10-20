import { productFacetsQuerySchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getProductFacets } from "@/lib/products";

/**
 * Opciones de filtro (tipos y marcas con su cantidad) para una búsqueda -
 * `GET /api/products/facets?q=...&type=...&brandId=...`. Con `q` vacío devuelve los tipos y
 * marcas más grandes del catálogo.
 */
export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const parsed = productFacetsQuerySchema.safeParse({
    q: params.get("q") ?? "",
    type: params.get("type") ?? undefined,
    brandId: params.get("brandId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const facets = await getProductFacets(parsed.data.q, { type: parsed.data.type, brandId: parsed.data.brandId });
  return NextResponse.json(facets);
}
