import { Prisma, prisma } from "@depaso/database";
import { priceReportInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { recomputeConsensus } from "@/lib/priceConsensus";

/** Reporte comunitario: se recibe como aporte, no sobrescribe precios ni salta moderación. */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  // Límite MVP documentable: 10/hora por cuenta; en producción debe migrar a store compartido.
  if (!checkRateLimit(`price-report:${current.userId}`, 10, 60 * 60 * 1000)) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  const parsed = priceReportInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  const [variant, branch] = await Promise.all([prisma.productVariant.findUnique({ where: { id: parsed.data.productVariantId }, select: { id: true } }), prisma.storeBranch.findFirst({ where: { id: parsed.data.storeBranchId, status: "ACTIVE" }, select: { id: true } })]);
  if (!variant || !branch) return NextResponse.json({ error: "PRODUCT_OR_BRANCH_NOT_FOUND" }, { status: 404 });
  const report = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const created = await tx.priceReport.create({ data: { ...parsed.data, userId: current.userId } });
    // Equivale a `recordReportSubmitted`: sólo aumenta el contador, sin exponer ni
    // recalibrar el score hasta que consenso/moderación determine el resultado.
    await tx.userTrustScore.upsert({ where: { userId: current.userId }, create: { userId: current.userId, score: 0.5, reportsSubmitted: 1, reportsConfirmed: 0 }, update: { reportsSubmitted: { increment: 1 } } });
    return created;
  });
  // Pasos 3-9 del flujo de consenso (FLOWS.md p.6-8) — corre después del `$transaction` de
  // arriba para no bloquear la escritura del reporte si el recálculo tarda.
  await recomputeConsensus(parsed.data.productVariantId, parsed.data.storeBranchId);
  return NextResponse.json({ id: report.id, createdAt: report.createdAt.toISOString(), status: "RECEIVED" }, { status: 201 });
}
