import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toMerchantRequestResponse } from "@/lib/merchant";
import { postAsQuery } from "@/lib/http/postAdapter";

/** Última solicitud del usuario actual (o `null` si nunca pidió ser comercio). */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const latest = await prisma.merchantRequest.findFirst({
    where: { userId: current.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ request: latest ? toMerchantRequestResponse(latest) : null });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postAsQuery(handle);
