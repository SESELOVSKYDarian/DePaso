import { prisma } from "@depaso/database";
import type { NextRequest } from "next/server";
import { getClientIp } from "./request";

/** "Android · Chrome", "Windows · Firefox"… a partir del User-Agent. Sirve para que la persona reconozca el acceso. */
export function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Dispositivo desconocido";
  // la app móvil (React Native / Expo) manda okhttp o CFNetwork
  if (/okhttp|Dalvik/i.test(userAgent)) return "App DePaso · Android";
  if (/CFNetwork|Darwin/i.test(userAgent)) return "App DePaso · iPhone";
  const system = /Android/i.test(userAgent)
    ? "Android"
    : /iPhone|iPad/i.test(userAgent)
      ? "iPhone"
      : /Windows/i.test(userAgent)
        ? "Windows"
        : /Mac OS X/i.test(userAgent)
          ? "Mac"
          : /Linux/i.test(userAgent)
            ? "Linux"
            : "Otro sistema";
  const browser = /Edg\//i.test(userAgent) ? "Edge" : /Firefox\//i.test(userAgent) ? "Firefox" : /Chrome\//i.test(userAgent) ? "Chrome" : /Safari\//i.test(userAgent) ? "Safari" : "navegador";
  return `${system} · ${browser}`;
}

/** Deja asentado un inicio de sesión (nunca rompe el login si falla). */
export async function recordLogin(request: NextRequest, userId: string): Promise<void> {
  try {
    const ip = getClientIp(request);
    await prisma.loginEvent.create({
      data: { userId, ip: ip === "unknown" ? null : ip.slice(0, 64), device: describeDevice(request.headers.get("user-agent")).slice(0, 120) },
    });
  } catch (error) {
    console.error("No se pudo registrar el inicio de sesión:", error);
  }
}
