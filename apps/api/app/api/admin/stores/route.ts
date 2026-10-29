import { prisma } from "@depaso/database";
import { storeInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toStoreResponse } from "@/lib/catalog/catalogAdmin";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const json = await request.json().catch(() => null);
  const parsed = storeInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const store = await prisma.store.create({
    data: parsed.data,
    include: { _count: { select: { branches: true } } },
  });
  return NextResponse.json(toStoreResponse(store), { status: 201 });
}
