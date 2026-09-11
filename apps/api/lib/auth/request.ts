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

/** Best-effort — sin infra de proxy real todavía, `x-forwarded-for` puede faltar en dev. */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return "unknown";
}
