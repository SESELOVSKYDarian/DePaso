import { prisma } from "@depaso/database";
import { storeBranchUpdateSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { branchInclude, resolveRegionId, toStoreBranchResponse } from "@/lib/catalog/catalogAdmin";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function handle(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = storeBranchUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const { city, ...fields } = parsed.data;
  const { count } = await prisma.storeBranch.updateMany({
    where: { id },
    data: { ...fields, ...(city ? { marketRegionId: await resolveRegionId(city) } : {}) },
  });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const branch = await prisma.storeBranch.findUniqueOrThrow({ where: { id }, include: branchInclude });
  return NextResponse.json(toStoreBranchResponse(branch));
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postWithParams(["id"], handle);
