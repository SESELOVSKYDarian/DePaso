import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toCustomStoreResponse } from "@/lib/user/customStores";
import { postAsQuery } from "@/lib/http/postAdapter";

/** Los comercios que la persona anotó a mano. */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const rows = await prisma.customStorePreference.findMany({ where: { userId: current.userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ preferences: rows.map(toCustomStoreResponse) });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postAsQuery(handle);