import { prisma } from "@depaso/database";
import { storePreferenceInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toStorePreferenceResponse } from "@/lib/user/preferences";
import { postWithParams } from "@/lib/http/postAdapter";

const include = { storeBranch: { include: { store: true } } } as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/preferences/stores — guarda un comercio preferido (o a evitar) para una categoría. */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = storePreferenceInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const branch = await prisma.storeBranch.findUnique({ where: { id: parsed.data.storeBranchId } });
  if (!branch) return NextResponse.json({ error: "STORE_BRANCH_NOT_FOUND" }, { status: 400 });

  const pref = await prisma.storePreference.create({
    data: { ...parsed.data, userId: current.userId },
    include,
  });

  return NextResponse.json(toStorePreferenceResponse(pref), { status: 201 });
}

async function handleDelete(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const { count } = await prisma.storePreference.deleteMany({ where: { id, userId: current.userId } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// DELETE: los datos (incluido el id) llegan en el body JSON.
export const DELETE = postWithParams(["id"], handleDelete);
