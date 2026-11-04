import { prisma } from "@depaso/database";
import { adDecisionSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { loadProductNames, toAdResponse } from "@/lib/ads/ads";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { runInBackground } from "@/lib/http/background";
import { postWithParams } from "@/lib/http/postAdapter";
import { notifyUsers } from "@/lib/push/notify";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * `PUT /api/admin/ads` — el administrador aprueba o rechaza un pedido. Al aprobar queda fijado el
 * monto acordado (por defecto lo que ofreció el comercio) y los días, y empieza a regir desde ya.
 */
async function handleDecision(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const parsed = adDecisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });

  const existing = await prisma.adRequest.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (existing.status !== "PENDING") return NextResponse.json({ error: "ALREADY_RESOLVED" }, { status: 409 });

  const { decision, agreedAmount, counterAmount, durationDays, note } = parsed.data;
  const now = new Date();
  const days = durationDays ?? existing.durationDays;
  const updated = await prisma.adRequest.update({
    where: { id },
    data:
      decision === "COUNTER"
        ? { status: "COUNTER", counterAmount: counterAmount ?? null, durationDays: days, adminNote: note || null, reviewedById: admin.userId }
        : decision === "APPROVE"
        ? {
            status: "APPROVED",
            agreedAmount: agreedAmount ?? existing.offeredAmount,
            durationDays: days,
            adminNote: note || null,
            reviewedById: admin.userId,
            reviewedAt: now,
            startsAt: now,
            endsAt: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
          }
        : { status: "REJECTED", adminNote: note ?? null, reviewedById: admin.userId, reviewedAt: now },
  });

  // al comercio le llega el resultado como notificación del celular
  runInBackground(() =>
    notifyUsers({
      category: "news",
      userIds: [existing.userId],
      title: decision === "COUNTER" ? "Te proponemos otro monto" : decision === "APPROVE" ? "Aprobamos tu publicidad" : "Tu pedido de publicidad no se aprobó",
      body:
        decision === "COUNTER"
          ? `Por "${updated.title}" proponemos $${Math.round(counterAmount ?? 0).toLocaleString("es-AR")}. Entrá a Publicidad para responder.`
          : decision === "APPROVE"
            ? `"${updated.title}" ya se muestra en la app por ${days} días.`
            : (note ?? "Mirá el motivo en tu panel."),
      data: { type: "ad" },
    }),
  );
  return NextResponse.json(toAdResponse(updated, { productNames: await loadProductNames([updated]) }));
}

// PUT: el id llega en el body JSON.
export const PUT = postWithParams(["id"], handleDecision);
