import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { syncPaymentPromos } from "@/lib/syncPromos";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Sincroniza las promos de bancos/billeteras. Lo llama el cron de Vercel (con
 * `Authorization: Bearer $CRON_SECRET`) o un admin autenticado.
 */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const isCron = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
  if (!isCron && !(await requireAdmin(request))) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    return NextResponse.json(await syncPaymentPromos());
  } catch (error) {
    console.error("Falló la sincronización de promos:", error);
    return NextResponse.json({ error: "SYNC_FAILED" }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
