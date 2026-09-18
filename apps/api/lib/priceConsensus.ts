import { prisma } from "@depaso/database";
import {
  DEFAULT_CONSENSUS_THRESHOLDS,
  INITIAL_TRUST_SCORE,
  evaluateConsensus,
  recordReportOutcome,
  toConfidenceLevel,
  type PriceReportCandidate,
  type ReportOutcome,
} from "@depaso/community";

const WINDOW_HOURS = 24;

/**
 * Corre `PriceConsensusService` (@depaso/community) para un producto+sucursal después de
 * un reporte nuevo — pasos 3-9 del flujo de BUSINESS-RULES.md p.6-8 (`FLOWS.md`, "Flujo de
 * reporte de precio y consenso comunitario"). Nunca sobreescribe `Price` sin dejar
 * `PriceHistory` (regla obligatoria p.7).
 */
export async function recomputeConsensus(productVariantId: string, storeBranchId: string): Promise<void> {
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);
  const reports = await prisma.priceReport.findMany({
    where: { productVariantId, storeBranchId, createdAt: { gte: since } },
    select: { id: true, userId: true, reportedPrice: true, photoEvidenceUrl: true, createdAt: true },
  });
  if (reports.length === 0) return;

  const userIds = [...new Set(reports.map((r: (typeof reports)[number]) => r.userId))];
  const trustScores = await prisma.userTrustScore.findMany({ where: { userId: { in: userIds } } });
  const scoreByUser = new Map(
    trustScores.map((t: (typeof trustScores)[number]) => [t.userId, t.score])
  );

  const candidates: PriceReportCandidate[] = reports.map((r: (typeof reports)[number]) => ({
    id: r.id,
    userId: r.userId,
    productVariantId,
    storeBranchId,
    reportedPrice: Number(r.reportedPrice),
    hasEvidence: r.photoEvidenceUrl != null,
    reportedAt: r.createdAt,
  }));

  const existingPrice = await prisma.price.findFirst({
    where: { productVariantId, storeBranchId },
    orderBy: { reportedAt: "desc" },
  });

  const decision = evaluateConsensus(
    productVariantId,
    storeBranchId,
    candidates,
    existingPrice ? { amount: Number(existingPrice.price), status: existingPrice.status } : null,
    (userId) => scoreByUser.get(userId) ?? INITIAL_TRUST_SCORE.score,
    DEFAULT_CONSENSUS_THRESHOLDS
  );

  await applyPriceDecision(productVariantId, storeBranchId, decision, existingPrice);
  await applyTrustOutcomes(reports, decision);
}

async function applyPriceDecision(
  productVariantId: string,
  storeBranchId: string,
  decision: ReturnType<typeof evaluateConsensus>,
  existingPrice: Awaited<ReturnType<typeof prisma.price.findFirst>>
): Promise<void> {
  if (decision.consensusPrice !== null) {
    const confidence = toConfidenceLevel(decision.agreementRatio);
    if (existingPrice) {
      await prisma.$transaction([
        prisma.priceHistory.create({
          data: {
            priceId: existingPrice.id,
            productVariantId,
            storeBranchId,
            amount: existingPrice.price,
            status: existingPrice.status,
            changeReason: decision.changeReason,
          },
        }),
        prisma.price.update({
          where: { id: existingPrice.id },
          data: {
            price: decision.consensusPrice,
            status: "COMMUNITY_CONFIRMED",
            sourceType: "COMMUNITY",
            confidence,
            reportedAt: new Date(),
          },
        }),
      ]);
    } else {
      await prisma.price.create({
        data: {
          productVariantId,
          storeBranchId,
          price: decision.consensusPrice,
          sourceType: "COMMUNITY",
          status: "COMMUNITY_CONFIRMED",
          confidence,
        },
      });
    }
    return;
  }

  // Regla 5 (BUSINESS-RULES.md p.7): sin consenso, se conserva el precio anterior — sólo se
  // deja constancia del estado "discutido" cuando ya había un precio que disputar.
  if (decision.status === "DISPUTED" && existingPrice) {
    await prisma.$transaction([
      prisma.priceHistory.create({
        data: {
          priceId: existingPrice.id,
          productVariantId,
          storeBranchId,
          amount: existingPrice.price,
          status: existingPrice.status,
          changeReason: decision.changeReason,
        },
      }),
      prisma.price.update({ where: { id: existingPrice.id }, data: { status: "DISPUTED" } }),
    ]);
  }
}

/**
 * Regla 7 (BUSINESS-RULES.md p.7): "reportar distinto a otros no es infracción" — sólo se
 * premia (CONFIRMED) a los reportantes que quedaron dentro del set válido de un consenso
 * promovido, y sólo se penaliza (REJECTED) a quien reportó un salto imposible. La minoría
 * de buena fe que no llegó a consenso no se toca.
 */
async function applyTrustOutcomes(
  reports: { id: string; userId: string }[],
  decision: ReturnType<typeof evaluateConsensus>
): Promise<void> {
  const excludedIds = new Set([...decision.discardedReportIds, ...decision.anomalousReportIds]);

  if (decision.status === "COMMUNITY_CONFIRMED") {
    for (const report of reports) {
      if (excludedIds.has(report.id)) continue;
      await updateTrustOutcome(report.userId, "CONFIRMED");
    }
  }

  for (const reportId of decision.anomalousReportIds) {
    const report = reports.find((r: (typeof reports)[number]) => r.id === reportId);
    if (!report) continue;
    await updateTrustOutcome(report.userId, "REJECTED");
    await prisma.communityModerationEvent.create({
      data: {
        type: "PRICE_SENT_TO_REVIEW",
        targetPriceReportId: reportId,
        targetUserId: report.userId,
        reason: "Salto de precio anómalo detectado por PriceConsensusService (anti-fraude, BUSINESS-RULES.md p.8).",
      },
    });
  }
}

async function updateTrustOutcome(userId: string, outcome: ReportOutcome): Promise<void> {
  const current = await prisma.userTrustScore.findUnique({ where: { userId } });
  const next = recordReportOutcome(current ?? INITIAL_TRUST_SCORE, outcome);
  await prisma.userTrustScore.upsert({
    where: { userId },
    create: {
      userId,
      score: next.score,
      reportsSubmitted: current?.reportsSubmitted ?? 1,
      reportsConfirmed: next.reportsConfirmed,
    },
    update: { score: next.score, reportsConfirmed: next.reportsConfirmed },
  });
}
