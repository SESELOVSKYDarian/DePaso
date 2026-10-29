import type { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "depaso_session";

/**
 * El token viaja como cookie httpOnly (web) o header `Authorization: Bearer` (mobile, sin
 * cookies de navegador — se guarda en SecureStore del lado del cliente). Se acepta
 * cualquiera de los dos acá.
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }
  return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * IP del cliente para los límites de intentos. Detrás del proxy de EasyPanel el cliente puede
 * escribir lo que quiera en `x-forwarded-for`; lo que agrega el proxy va al FINAL, por eso se
 * toma el último valor (el primero se podía inventar para esquivar el límite).
 */
export function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",").at(-1)!.trim();
  return "unknown";
}
