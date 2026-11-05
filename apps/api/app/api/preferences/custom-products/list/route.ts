import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { postAsQuery } from "@/lib/http/postAdapter";

/** Los productos que la persona anotó a mano. */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const rows = await prisma.customProductPreference.findMany({ where: { userId: current.userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ preferences: rows.map((row: (typeof rows)[number]) => ({ id: row.id, name: row.name, type: row.type })) });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postAsQuery(handle);