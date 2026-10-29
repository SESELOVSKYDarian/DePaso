import { NextResponse, type NextRequest } from "next/server";

/**
 * CORS para `/api/*`. Lo necesitan la versión web de la app y el panel admin, que llaman a la
 * API desde el navegador en otro dominio. La app nativa no lo usa (el `fetch` de React Native
 * no aplica CORS).
 *
 * Si está definida `CORS_ALLOWED_ORIGINS` (dominios separados por coma, ej. el de la web en
 * EasyPanel), solo esos orígenes y `localhost` pueden llamar desde un navegador. Si no está
 * definida, se acepta el origen que llegue (útil para probar).
 */
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

function isAllowed(origin: string): boolean {
  if (allowedOrigins.length === 0) return true;
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  return allowedOrigins.includes(origin);
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  // Nunca GET: leer y crear es POST, actualizar es PUT y borrar es DELETE.
  const corsHeaders = new Headers({
    "Access-Control-Allow-Methods": "POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  if (origin && isAllowed(origin)) {
    corsHeaders.set("Access-Control-Allow-Origin", origin);
    corsHeaders.set("Access-Control-Allow-Credentials", "true");
    corsHeaders.set("Vary", "Origin");
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
