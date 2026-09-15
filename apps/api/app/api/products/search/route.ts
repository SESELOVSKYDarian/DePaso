import { productSearchQuerySchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { searchProducts } from "@/lib/products";

/** Búsqueda de catálogo (Fase 8, sección 37) — `GET /api/products/search?q=...`. */
export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = productSearchQuerySchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const results = await searchProducts(parsed.data.q);
  return NextResponse.json({ results });
}
