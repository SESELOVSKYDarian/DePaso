import { prisma } from "@depaso/database";
import { storeBranchUpdateSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toStoreBranchResponse } from "@/lib/catalogAdmin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = storeBranchUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const { count } = await prisma.storeBranch.updateMany({ where: { id }, data: parsed.data });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const branch = await prisma.storeBranch.findUniqueOrThrow({ where: { id }, include: { store: true } });
  return NextResponse.json(toStoreBranchResponse(branch));
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const { count } = await prisma.storeBranch.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
