import { prisma } from "@depaso/database";
import { storeInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toStoreResponse } from "@/lib/catalog/catalogAdmin";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function handle(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = storeInputSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const { count } = await prisma.store.updateMany({ where: { id }, data: parsed.data });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const store = await prisma.store.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { branches: true } } },
  });
  return NextResponse.json(toStoreResponse(store));
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postWithParams(["id"], handle);
