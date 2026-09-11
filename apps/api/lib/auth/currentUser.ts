import type { NextRequest } from "next/server";
import { prisma } from "@depaso/database";
import type { AuthUserResponse } from "@depaso/validation";
import { getTokenFromRequest } from "./request";
import { verifySession } from "./session";

export interface CurrentUser {
  userId: string;
  token: string;
}

/**
 * Resuelve la sesión activa desde la request. No confiar nunca en un `userId` que venga
 * del body/headers del cliente sin pasar por acá (sección 81) — todo endpoint que actúa
 * "como el usuario actual" debe usar el `userId` que devuelve esta función, no uno recibido
 * en el payload.
 */
export async function getCurrentUser(request: NextRequest): Promise<CurrentUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const session = await verifySession(token);
  if (!session) return null;

  return { userId: session.userId, token };
}

export async function toAuthUserResponse(userId: string): Promise<AuthUserResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user || user.deletedAt) return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    marketingOptIn: user.profile?.marketingOptIn ?? false,
    createdAt: user.createdAt.toISOString(),
  };
}
