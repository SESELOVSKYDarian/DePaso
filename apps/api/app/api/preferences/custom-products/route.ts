import { prisma } from "@depaso/database";
import { customProductPreferenceInputSchema, type CustomProductPreferenceResponse } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { postWithParams } from "@/lib/http/postAdapter";

/** Cuántos productos a mano puede anotar una persona. */
const MAX_PER_USER = 50;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/preferences/custom-products — anota la preferencia de un producto que no está en el catálogo. */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = customProductPreferenceInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });

  const count = await prisma.customProductPreference.count({ where: { userId: current.userId } });
  if (count >= MAX_PER_USER) return NextResponse.json({ error: "LIMIT_REACHED", max: MAX_PER_USER }, { status: 422 });

  const created = await prisma.customProductPreference.create({ data: { ...parsed.data, userId: current.userId } });
  const body: CustomProductPreferenceResponse = { id: created.id, name: created.name, type: created.type };
  return NextResponse.json(body, { status: 201 });
}

async function handleDelete(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const { count } = await prisma.customProductPreference.deleteMany({ where: { id, userId: current.userId } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// DELETE: el id llega en el body JSON.
export const DELETE = postWithParams(["id"], handleDelete);