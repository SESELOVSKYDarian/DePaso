import { NextRequest, NextResponse } from "next/server";

/** Esquemas a los que se puede devolver el control: la app (build) y Expo Go. */
const ALLOWED_APP_SCHEMES = new Set(["depaso:", "exp:", "exps:"]);

/**
 * `GET /api/auth/oauth/callback` — única URL https que se registra en Google, Meta y Discord.
 * El proveedor vuelve acá con `code` y `state`; el `state` trae (`nonce|uri-de-la-app`) y se
 * reenvía el `code` a esa URI para que la app termine el canje. Sirve igual en Expo Go y en
 * un build, y evita registrar esquemas personalizados (que Google no acepta en clientes web).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const state = params.get("state") ?? "";
  const separator = state.indexOf("|");
  const appUri = separator >= 0 ? state.slice(separator + 1) : "";

  let target: URL;
  try {
    target = new URL(appUri);
  } catch {
    return new NextResponse("Link de inicio de sesión inválido.", { status: 400 });
  }
  if (!ALLOWED_APP_SCHEMES.has(target.protocol)) {
    return new NextResponse("Link de inicio de sesión inválido.", { status: 400 });
  }

  for (const key of ["code", "state", "error", "error_description"]) {
    const value = params.get(key);
    if (value) target.searchParams.set(key, value);
  }
  return NextResponse.redirect(target, 302);
}
