import { prisma } from "@depaso/database";
import { moderationActionInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

/**
 * Acción de moderación sobre un reporte comunitario (FLOWS.md p.8: "Moderación puede
 * ponderar, ocultar, rechazar o corregir el aporte, dejando trazabilidad interna"). Sólo
 * registra el evento con quién/qué/por qué — no hay mecanismo de suspensión de cuenta
 * implementado en el schema todavía (`USER_SUSPENDED` queda como evento auditable, no
 * bloquea login; NO DEFINIDO en la documentación qué debería bloquear exactamente).
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = moderationActionInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const report = await prisma.priceReport.findUnique({
    where: { id: parsed.data.targetPriceReportId },
    select: { id: true, userId: true },
  });
  if (!report) return NextResponse.json({ error: "REPORT_NOT_FOUND" }, { status: 404 });

  const event = await prisma.communityModerationEvent.create({
    data: {
      type: parsed.data.type,
      targetPriceReportId: report.id,
      targetUserId: report.userId,
      reason: parsed.data.reason,
      createdByAdminId: admin.userId,
    },
  });

  return NextResponse.json({ id: event.id, createdAt: event.createdAt.toISOString() }, { status: 201 });
}
