import { prisma } from "@depaso/database";
import { NextResponse } from "next/server";
import { postAsQuery } from "@/lib/http/postAdapter";

import { llmApiKey, sttApiKey } from "@/lib/env";
import { isEmailConfigured } from "@/lib/integrations/email";

/** Qué funciones opcionales tiene configuradas el servidor. Solo sí/no: nunca se muestran valores. */
function configuredFeatures() {
  const has = (name: string) => Boolean(process.env[name]?.trim());
  return {
    email: isEmailConfigured(),
    voice: Boolean(sttApiKey()),
    assistant: Boolean(llmApiKey()),
    maps: has("MAPBOX_ACCESS_TOKEN"),
    adminEmails: has("ADMIN_EMAILS"),
  };
}

export const dynamic = "force-dynamic";

/** Chequeo de salud: verifica que la API llegue a la base. No expone credenciales ni URLs. */
async function handle() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, features: configuredFeatures() });
  } catch (error) {
    // el detalle queda en el log del servidor; el público solo ve que no está disponible
    console.error("health: la base no responde", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
