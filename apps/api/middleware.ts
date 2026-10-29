import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware de `/api/*`: CORS y encabezados de seguridad.
 *
 * CORS: la versión web de la app llama a la API desde el navegador, en otro dominio. La app
 * nativa no lo usa (el `fetch` de React Native no aplica CORS). Solo pueden llamar desde un
 * navegador los dominios de `CORS_ALLOWED_ORIGINS` (separados por coma) y `localhost` para
 * desarrollo. Si la variable no está definida, solo se acepta `localhost`: nunca "cualquier origen".
 */
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

function isAllowed(origin: string): boolean {
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  return allowedOrigins.includes(origin);
}

/** Encabezados que se agregan a toda respuesta de la API (es JSON: nada se muestra ni se incrusta). */
const SECURITY_HEADERS: Record<string, string> = {
  // el navegador no adivina el tipo de contenido
  "X-Content-Type-Options": "nosniff",
  // solo https, también en subdominios, durante un año
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  // la API no se puede abrir dentro de un iframe ni cargar nada
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=(), payment=()",
  // las respuestas tienen datos de cada usuario: no se guardan en cachés compartidas
  "Cache-Control": "no-store",
};

/** Lo máximo que se acepta en un pedido: 1 MB (listas, precios, etc.) y 5 MB para el audio del dictado. */
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  // Nunca GET: leer y crear es POST, actualizar es PUT y borrar es DELETE.
  const corsHeaders = new Headers({
    "Access-Control-Allow-Methods": "POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    // el navegador recuerda el permiso un día: menos preguntas previas, app más rápida
    "Access-Control-Max-Age": "86400",
  });
  if (origin && isAllowed(origin)) {
    corsHeaders.set("Access-Control-Allow-Origin", origin);
    corsHeaders.set("Vary", "Origin");
  }

  if (request.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 204, headers: corsHeaders });
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) preflight.headers.set(key, value);
    return preflight;
  }

  // Un cuerpo enorme no se procesa: protege la memoria del servidor de pedidos abusivos.
  const declaredBytes = Number(request.headers.get("content-length") ?? 0);
  const limit = request.nextUrl.pathname === "/api/ai/transcribe" ? MAX_UPLOAD_BYTES : MAX_BODY_BYTES;
  if (declaredBytes > limit) {
    const tooLarge = NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413, headers: corsHeaders });
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) tooLarge.headers.set(key, value);
    return tooLarge;
  }

  const response = NextResponse.next();
  corsHeaders.forEach((value, key) => response.headers.set(key, value));
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(key, value);
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
