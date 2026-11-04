import { prisma } from "@depaso/database";
import { adminMerchantToggleSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * `PUT /api/admin/merchants` — el administrador habilita o deshabilita un comercio. Deshabilitado,
 * su sucursal deja de aparecer en los resultados y su publicidad se deja de mostrar; no se borra nada.
 */
async function handleToggle(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const parsed = adminMerchantToggleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });

  // solo se tocan sucursales que tienen un comercio dueño (no las importadas)
  const { count } = await prisma.storeBranch.updateMany({
    where: { id, ownerUserId: { not: null } },
    data: { status: parsed.data.enabled ? "ACTIVE" : "INACTIVE" },
  });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// PUT: el id de la sucursal llega en el body JSON como `id`.
export const PUT = postWithParams(["id"], handleToggle);
