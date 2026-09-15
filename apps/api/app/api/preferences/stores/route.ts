import { prisma } from "@depaso/database";
import { storePreferenceInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toStorePreferenceResponse } from "@/lib/preferences";

const include = { storeBranch: { include: { store: true } } } as const;

/** Preferencias de comercio por categoría (Fase 10, sección 87). */
export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const prefs = await prisma.storePreference.findMany({
    where: { userId: current.userId },
    include,
  });

  return NextResponse.json({ preferences: prefs.map(toStorePreferenceResponse) });
}

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
