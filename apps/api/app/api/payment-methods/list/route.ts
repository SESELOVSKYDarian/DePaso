import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { postAsQuery } from "@/lib/http/postAdapter";

/** Medios de pago que el usuario declaró tener (billeteras y tarjetas). */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const rows = await prisma.userPaymentMethod.findMany({ where: { userId: current.userId } });
  return NextResponse.json({ methods: rows.map((row: (typeof rows)[number]) => row.methodSlug) });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postAsQuery(handle);
