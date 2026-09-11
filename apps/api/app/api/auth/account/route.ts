import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { revokeAllUserSessions } from "@/lib/auth/session";
import { clearSessionCookie } from "@/lib/auth/cookies";

/**
 * Eliminar cuenta (sección 10 del master prompt; derecho del titular obligatorio,
 * LEGAL.md "Derechos del titular"). Borrado lógico + anonimización del email, no un
 * `DELETE` en cascada real: reportes de precio comunitarios quedan
 * desidentificados/seudonimizados (LEGAL.md, tabla de retención — "Precio comunitario:
 * conservar histórico desidentificado"), no se borran junto con la cuenta.
 */
export async function DELETE(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  await prisma.user.update({
    where: { id: current.userId },
    data: {
      deletedAt: new Date(),
      email: `deleted-${current.userId}@depaso.invalid`,
      displayName: null,
    },
  });
  await revokeAllUserSessions(current.userId);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
