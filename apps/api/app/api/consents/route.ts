import { Prisma, prisma } from "@depaso/database";
import { LEGAL_DOCUMENT_VERSIONS } from "@depaso/domain";
import { consentRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";

/**
 * Consentimientos posteriores al registro — hoy sólo LOCATION (sección 30-31: "Permitir
 * mientras uso DePaso" / "Ingresar dirección manualmente" / "Ahora no", pedido recién en
 * la primera optimización, no en el registro). MARKETING también se puede togglear acá
 * además de por `PATCH /api/auth/me` (mismo efecto, distinto punto de entrada).
 */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = consentRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { type, accepted } = parsed.data;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.userConsent.create({
      data: {
        userId: current.userId,
        type,
        // LOCATION no tiene un documento versionado detrás (es un permiso, no un texto
        // legal) — mismo criterio que MARKETING en el registro.
        documentVersion: type === "LOCATION" ? LEGAL_DOCUMENT_VERSIONS.PRIVACY : "n/a",
        accepted,
      },
    });
    if (type === "MARKETING") {
      await tx.userProfile.update({ where: { userId: current.userId }, data: { marketingOptIn: accepted } });
    }
  });

  return NextResponse.json({ ok: true });
}
