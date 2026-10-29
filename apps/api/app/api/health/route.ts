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
    // el detalle queda en el log del servidor; el público solo ve que no está disponible
    console.error("health: la base no responde", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
