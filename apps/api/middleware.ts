import { NextResponse, type NextRequest } from "next/server";

/**
 * CORS para `/api/*`. Necesario desde que `apps/admin` (Fase 11/12) llama a `apps/api`
 * desde el navegador en otro puerto — `apps/mobile` nunca lo necesitó (React Native `fetch`
 * no aplica CORS). Refleja el `Origin` de la request en vez de una lista fija: no hay
 * dominios de producción definidos todavía (Fase 27, "No empezado" en
 * docs/development/IMPLEMENTATION-PLAN.md) — cuando exista un dominio real de
 * `apps/admin`/`apps/web`, esto debería acotarse a un allowlist explícito.
 */
export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = new Headers({
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  if (origin) {
    corsHeaders.set("Access-Control-Allow-Origin", origin);
    corsHeaders.set("Access-Control-Allow-Credentials", "true");
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const response = NextResponse.next();
  corsHeaders.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
