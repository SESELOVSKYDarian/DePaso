import { prisma } from "@depaso/database";
import type { AdminOptimizationRunResponse } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

/** Observabilidad de corridas del motor de optimización (Fase 20). */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const runs = await prisma.optimizationRun.findMany({
    include: { user: { select: { email: true } }, plans: { select: { estimatedSavings: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const body: { runs: AdminOptimizationRunResponse[] } = {
    runs: runs.map((r) => ({
      id: r.id,
      userEmail: r.user.email,
      mode: r.mode,
      transportMode: r.transportMode,
      createdAt: r.createdAt.toISOString(),
      planCount: r.plans.length,
      bestEstimatedSavings:
        r.plans.length > 0 ? Math.max(...r.plans.map((p) => Number(p.estimatedSavings))) : null,
    })),
  };
  return NextResponse.json(body);
}
