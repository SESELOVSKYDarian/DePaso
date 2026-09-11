import { prisma } from "@depaso/database";
import { userPlaceUpdateSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toPlaceResponse } from "@/lib/places";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = userPlaceUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  // updateMany con userId en el where, no findFirst+update: evita una carrera donde el
  // dueño cambia entre el check y el update, y confirma en una sola consulta que el
  // lugar es realmente de este usuario (sección 81 — nunca confiar en el id del body/URL
  // sin revalidar contra la sesión).
  const { count } = await prisma.userPlace.updateMany({
    where: { id, userId: current.userId },
    data: parsed.data,
  });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const place = await prisma.userPlace.findUniqueOrThrow({ where: { id } });
  return NextResponse.json(toPlaceResponse(place));
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const { count } = await prisma.userPlace.deleteMany({ where: { id, userId: current.userId } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
