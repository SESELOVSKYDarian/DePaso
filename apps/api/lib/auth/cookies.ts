import type { NextResponse } from "next/server";
import { ACCESS_TOKEN_TTL_MINUTES } from "@depaso/domain";
import { SESSION_COOKIE_NAME } from "./request";

/** Guarda el access token en una cookie httpOnly (la usa la web; la app manda el header Authorization). */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_MINUTES * 60,
  });
}

/** Borra la cookie de sesión al cerrar sesión. */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
