import { prisma } from "@depaso/database";
import { customStorePreferenceInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toCustomStoreResponse } from "@/lib/user/customStores";
import { postWithParams } from "@/lib/http/postAdapter";

/** Cuántos comercios a mano puede anotar una persona. */
const MAX_PER_USER = 50;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/preferences/custom-stores — anota un comercio que no está en la lista, marcado en el mapa. */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = customStorePreferenceInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });

  const count = await prisma.customStorePreference.count({ where: { userId: current.userId } });
  if (count >= MAX_PER_USER) return NextResponse.json({ error: "LIMIT_REACHED", max: MAX_PER_USER }, { status: 422 });

  const { address, ...rest } = parsed.data;
  const created = await prisma.customStorePreference.create({ data: { ...rest, address: address || null, userId: current.userId } });
  return NextResponse.json(toCustomStoreResponse(created), { status: 201 });
}

async function handleDelete(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const { count } = await prisma.customStorePreference.deleteMany({ where: { id, userId: current.userId } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// DELETE: el id llega en el body JSON.
export const DELETE = postWithParams(["id"], handleDelete);