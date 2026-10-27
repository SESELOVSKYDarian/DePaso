import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function handle(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const { count } = await prisma.storeBranch.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postWithParams(["id"], handle);
