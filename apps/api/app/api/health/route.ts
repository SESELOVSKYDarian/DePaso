import { prisma } from "@depaso/database";
import { NextResponse } from "next/server";
import { postAsQuery } from "@/lib/http/postAdapter";

export const dynamic = "force-dynamic";

/** Chequeo de salud: verifica que la API llegue a la base. No expone credenciales ni URLs. */
async function handle() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    const code = typeof (error as { code?: unknown })?.code === "string" ? (error as { code: string }).code : null;
    const message = error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 300) : "unknown";
    return NextResponse.json({ ok: false, name, code, message }, { status: 503 });
  }
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
