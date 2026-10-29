import { prisma } from "@depaso/database";
import { userPlaceInputSchema, userPlaceUpdateSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toPlaceResponse } from "@/lib/user/places";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/places — guarda un lugar del usuario (casa, trabajo, otro). */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = userPlaceInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const place = await prisma.userPlace.create({
    data: { ...parsed.data, userId: current.userId },
  });

  return NextResponse.json(toPlaceResponse(place), { status: 201 });
}

async function handleUpdate(request: NextRequest, { params }: RouteParams) {
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

// PUT: los datos (incluido el id) llegan en el body JSON.
export const PUT = postWithParams(["id"], handleUpdate);

async function handleDelete(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const { count } = await prisma.userPlace.deleteMany({ where: { id, userId: current.userId } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// DELETE: los datos (incluido el id) llegan en el body JSON.
export const DELETE = postWithParams(["id"], handleDelete);
