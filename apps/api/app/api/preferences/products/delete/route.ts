import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ productId: string }>;
}

async function handle(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { productId } = await params;
  const { count } = await prisma.productPreference.deleteMany({
    where: { productId, userId: current.userId },
  });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postWithParams(["productId"], handle);
