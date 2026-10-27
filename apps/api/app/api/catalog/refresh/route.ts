import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { refreshProductPopularity } from "@/lib/catalogMaintenance";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Mantenimiento diario del catálogo: lo llama el cron de Vercel (con `CRON_SECRET`) o un admin. */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const isCron = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
  if (!isCron && !(await requireAdmin(request))) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  try {
    return NextResponse.json({ updatedProducts: await refreshProductPopularity() });
  } catch (error) {
    console.error("Falló el mantenimiento del catálogo:", error);
    return NextResponse.json({ error: "REFRESH_FAILED" }, { status: 502 });
  }
}

export const POST = handle;
